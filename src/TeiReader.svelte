<svelte:options tag="tei-reader"/>

<script lang="ts">
	import { onMount, onDestroy, tick } from 'svelte';

	import { ready, load, uiConfig, currentSectionName, currentSection, document, currentFootnote } from './store';
	import { localStoreValue, localLoadValue } from './storage';
	import type { TEIMetadataNode } from 'tei-util/dist/types';

	let uiConfigSrc = '';
	let teiSchema = '';
	let teiSrc = '';
	let stylingSrc = '';
	let documentId = '';
	let breakpointMedium = 640;
	let breakpointLarge = 1024;
	export {teiSchema as teischema, uiConfigSrc as uiconfig, teiSrc as teisrc, stylingSrc as stylingsrc, documentId as documentid, breakpointMedium as breakpointmedium, breakpointLarge as breakpointlarge};

	let articleElement = null as HTMLElement;
	let mainElement = null as HTMLElement;
	let currentHeadingId = '';
	let scrollTrackingTimeout = -1;
	let breakpoint = 0;
	let breakpointCls = 'breakpoint-0';
	let showSections = false;
	let showHeadings = false;

	function handleContentClick(ev: Event) {
		if ($currentSection) {
			let target = ev.target as HTMLElement;
			let targets = [];
			while (target && target !== articleElement) {
				if (target.getAttribute('data-type')) {
					targets.push(target)
				}
				target = target.parentElement as HTMLElement;
			}
			let type = target.getAttribute('data-type');
			if ($currentSection.links) {
				for (let link of $currentSection.links) {
					const linkElements = targets.filter((target) => {
						const type = target.getAttribute('data-type');
						const linkTarget = target.getAttribute('data-attr-' + link.attr);
						return type && linkTarget && type.substring(type.indexOf('-') + 1) === link.name;
					});
					if (linkElements.length > 0) {
						window.open(linkElements[0].getAttribute('data-attr-' + link.attr), '_blank', 'noopener,noreferrer');
					}
				}
			}
			if ($currentSection.footnotes) {
				for (let footnote of $currentSection.footnotes) {
					const footnoteElements = targets.filter((target) => {
						const type = target.getAttribute('data-type');
						const footnoteTarget = target.getAttribute('data-attr-' + footnote.attr);
						return type && footnoteTarget && footnote.name === type.substring(type.indexOf('-') + 1) && $document[$currentSectionName].nested[footnote.targetName] && $document[$currentSectionName].nested[footnote.targetName][footnoteTarget];
					});
					if (footnoteElements.length > 0) {
						currentFootnote.set($document[$currentSectionName].nested[footnote.targetName][footnoteElements[0].getAttribute('data-attr-' + footnote.attr)]);
						break;
					}
				}
			}
		}
	}

	function handleNestedListClick(ev: Event) {
		if ($currentSection) {
			let target = ev.target as HTMLElement;
			let targets = [];
			while (target && target !== articleElement) {
				if (target.getAttribute('data-type')) {
					targets.push(target)
				}
				target = target.parentElement as HTMLElement;
			}
			let type = target.getAttribute('data-type');
			if ($currentSection.links) {
				for (let link of $currentSection.links) {
					const linkElements = targets.filter((target) => {
						const type = target.getAttribute('data-type');
						const linkTarget = target.getAttribute('data-attr-' + link.attr);
						return type && linkTarget && type.substring(type.indexOf('-') + 1) === link.name;
					});
					if (linkElements.length > 0) {
						window.open(linkElements[0].getAttribute('data-attr-' + link.attr), '_blank', 'noopener,noreferrer');
					}
				}
			}
			if ($currentSection.footnotes) {
				for (let footnote of $currentSection.footnotes) {
					const footnoteElements = targets.filter((target) => {
						const type = target.getAttribute('data-type');
						const footnoteTarget = target.getAttribute('data-attr-' + footnote.attr);
						return type && footnoteTarget && footnote.name === type.substring(type.indexOf('-') + 1) && $document[$currentSection.sectionName].nested[footnote.targetName] && $document[$currentSection.sectionName].nested[footnote.targetName][footnoteTarget];
					});
					if (footnoteElements.length > 0) {
						const nestedElement = articleElement.querySelector('#' + footnoteElements[0].getAttribute('data-attr-' + footnote.attr));
							if (nestedElement) {
								nestedElement.scrollIntoView();
							}
						break;
					}
				}
			}
		}
	}

	function selectSection(sectionName: string) {
		currentSectionName.set(sectionName);
		currentFootnote.set(null);
		if (articleElement) {
			articleElement.scrollTop = 0;
		}
	}

	function scrollToHeading(heading) {
		if (articleElement) {
			const headingElement = articleElement.querySelector('[data-attr-_tr-heading-id="' + heading.id + '"]');
			headingElement.scrollIntoView({
				behavior: 'smooth',
			});
		}
	}

	function scrollTracking(ev: Event) {
		window.clearTimeout(scrollTrackingTimeout);
		if (articleElement) {
			scrollTrackingTimeout = window.setTimeout(() => {
				const boundary = articleElement.scrollTop + articleElement.clientHeight / 2;
				const headings = articleElement.querySelectorAll('[data-attr-_tr-heading-id]');
				currentHeadingId = '';
				for (let heading of headings) {
					if ((heading as HTMLElement).offsetTop < boundary) {
						currentHeadingId = heading.getAttribute('data-attr-_tr-heading-id');
					} else {
						break;
					}
				}
				localStoreValue(documentId + '.' + $currentSectionName + '.scroll', articleElement.scrollTop);
			}, 50);
		}
	}

	function getSingleMetadataValue(node: TEIMetadataNode, path: string) {
		function traverse(current: TEIMetadataNode, pathElements: string[]) {
			const pathElement = pathElements[0];
			if (pathElement === 'text()') {
				return current.text;
			} else if (pathElement.startsWith('@')) {
				return current.attributes[pathElement.substring(1)];
			} else {
				for (let child of current.children) {
					if (child.tag === pathElement) {
						return traverse(child, pathElements.slice(1));
					}
				}
				return '';
			}
		}
		return traverse(node, path.split('/').slice(1));
	}

	function getMultiMetadataValue(node: TEIMetadataNode, path: string) {
		function traverse(current: TEIMetadataNode, pathElements: string[]) {
			const pathElement = pathElements[0];
			if (pathElement === 'text()') {
				return [current.text];
			} else if (pathElement.startsWith('@')) {
				return [current.attributes[pathElement.substring(1)]];
			} else {
				let result = [];
				for (let child of current.children) {
					if (child.tag === pathElement) {
						result = result.concat(traverse(child, pathElements.slice(1)));
					}
				}
				return result;
			}
		}
		return traverse(node, path.split('/').slice(1));
	}

	const currentSectionUnsubscribe = currentSection.subscribe((currentSection) => {
		if (currentSection) {
			setTimeout(() => {
				if (articleElement) {
					articleElement.scrollTop = localLoadValue(documentId + '.' + currentSection.name + '.scroll', 0) as number;
					scrollTracking(null);
				}
			}, 50);
		}
	});

	function resize() {
		if (mainElement) {
			if (mainElement.clientWidth > breakpointLarge) {
				breakpoint = 2;
				breakpointCls = 'breakpoint-0 breakpoint-1 breakpoint-2';
			} else if (mainElement.clientWidth > breakpointMedium) {
				breakpoint = 1;
				breakpointCls = 'breakpoint-0 breakpoint-1';
			} else {
				breakpoint = 0;
				breakpointCls = 'breakpoint-0';
			}
		}
	}

	onMount(() => {
		load(uiConfigSrc, teiSchema, teiSrc);
		window.addEventListener('resize', resize);
		tick().then(resize);
	});

	onDestroy(() => {
		window.removeEventListener('resize', resize);
		currentSectionUnsubscribe();
	});
</script>

{#if stylingSrc}
	<link rel="stylesheet" href={stylingSrc}/>
{/if}

<main bind:this={mainElement} class="{breakpointCls}">
	{#if !$ready}
		<div id="tr-loading">
			<!-- By Sam Herbert (@sherb), for everyone. More @ http://goo.gl/7AJzbL -->
			<svg width="72" height="72" viewBox="0 0 38 38" xmlns="http://www.w3.org/2000/svg" stroke="currentColor">
    			<g fill="none" fill-rule="evenodd">
    	    		<g transform="translate(1 1)" stroke-width="2">
	            		<circle stroke-opacity=".5" cx="18" cy="18" r="18"/>
            			<path d="M36 18c0-9.94-8.06-18-18-18">
                			<animateTransform
            	        		attributeName="transform"
        	            		type="rotate"
    	                		from="0 18 18"
	                    		to="360 18 18"
                    			dur="1s"
                    			repeatCount="indefinite"/>
            			</path>
        			</g>
    			</g>
			</svg>
		</div>
	{/if}
	{#if $uiConfig && $uiConfig.sections}
		<nav id="tr-sections" class="{showSections ? 'show-sections' : ''}">
			{#if breakpoint === 0}
				{#if showSections}
					<button on:click={() => { showSections = false; }} aria-label="Hide sections">
						<svg viewBox="0 0 24 24">
							<path fill="currentColor" d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
						</svg>
					</button>
				{:else}
					<button on:click={() => { showSections = true; }} aria-label="Show sections">
						<svg viewBox="0 0 24 24">
							<path fill="currentColor" d="M16,12A2,2 0 0,1 18,10A2,2 0 0,1 20,12A2,2 0 0,1 18,14A2,2 0 0,1 16,12M10,12A2,2 0 0,1 12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12M4,12A2,2 0 0,1 6,10A2,2 0 0,1 8,12A2,2 0 0,1 6,14A2,2 0 0,1 4,12Z" />
						</svg>
					</button>
				{/if}
			{/if}
			<ol>
				{#each $uiConfig.sections as section}
					{#if breakpoint === 0 && !showSections && section.name === $currentSectionName}
						<li role="presentation"><button on:click={() => { showSections = true; }} aria-current={section.name === $currentSectionName ? 'true' : 'false'} aria-label="Show sections">{section.label}</button></li>
					{/if}
					{#if breakpoint > 0 || showSections}
						<li role="presentation"><button on:click={() => { selectSection(section.name); showSections = false; }} aria-current={section.name === $currentSectionName ? 'true' : 'false'}>{section.label}</button></li>
					{/if}
				{/each}
				<li role="presentation"></li>
			</ol>
		</nav>
	{/if}
	{#if $currentSection && $currentSection.type === 'text' && $document && $document[$currentSectionName] && $document[$currentSectionName].headings.length > 0}
		<nav id="tr-headings" class="{showHeadings ? 'show-headings' : ''}">
			<ol>
				{#each $document[$currentSectionName].headings as heading}
					{#if breakpoint === 0 && !showHeadings && heading.id === currentHeadingId}
						<li><button on:click={() => { showHeadings = true; }} aria-label="Show headings">{heading.label}</button></li>
					{/if}
					{#if breakpoint > 0 || showHeadings}
						<li><button on:click={() => { scrollToHeading(heading); showHeadings = false; }} data-level={heading.level} aria-current={heading.id === currentHeadingId ? 'true' : 'false'}>{heading.label}</button></li>
					{/if}
				{/each}
				{#if breakpoint === 0 && !showHeadings && !currentHeadingId}
					<li><button on:click={() => { showHeadings = true; }} aria-label="Show headings">&nbsp;</button></li>
				{/if}
			</ol>
			{#if breakpoint === 0}
				{#if showHeadings}
					<button on:click={() => { showHeadings = false; }} aria-label="Hide headings">
						<svg viewBox="0 0 24 24">
							<path fill="currentColor" d="M7.41,15.41L12,10.83L16.59,15.41L18,14L12,8L6,14L7.41,15.41Z" />
						</svg>
					</button>
				{:else}
					<button on:click={() => { showHeadings = true; }} aria-label="Show headings">
						<svg viewBox="0 0 24 24">
							<path fill="currentColor" d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z" />
						</svg>
					</button>
				{/if}
			{/if}
		</nav>
	{/if}
	{#if $currentSection && $document && $document[$currentSectionName]}
		{#if $currentSection.type === 'text'}
			<article bind:this={articleElement} id="tr-text" on:click={handleContentClick} on:scroll={scrollTracking}>{@html $document[$currentSectionName].main}</article>
		{:else if $currentSection.type === 'nestedList'}
			<article bind:this={articleElement} id="tr-nested-list" on:click={handleNestedListClick} on:scroll={scrollTracking}>
				{#each $document[$currentSectionName] as nestedDoc}
					<section id={nestedDoc.id}>{@html nestedDoc.content}</section>
				{/each}
			</article>
		{:else if $currentSection.type === 'metadata'}
			<article bind:this={articleElement} id="tr-metadata" on:scroll={scrollTracking}>
				{#each $currentSection.entries as section}
					<section>
						<h2>{section.label}</h2>
						{#each section.entries as entry}
							<h3>{entry.label}</h3>
							{#if entry.type === 'single-text'}
								<p>{getSingleMetadataValue($document[$currentSectionName], entry.path)}</p>
							{:else if entry.type === 'multi-text'}
								{#each getMultiMetadataValue($document[$currentSectionName], entry.path) as value}
									<p>{value}</p>
								{/each}
							{/if}
						{/each}
					</section>
				{/each}
			</article>
		{/if}
	{/if}
	{#if $currentFootnote}
		<aside id="tr-footnote">
			<div on:click={handleContentClick}>{@html $currentFootnote}</div>
			<div>
				<button on:click={() => { currentFootnote.set(null); }} aria-label="Close">
					<svg viewBox="0 0 24 24">
						<path fill="currentColor" d="M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2C6.47,2 2,6.47 2,12C2,17.53 6.47,22 12,22C17.53,22 22,17.53 22,12C22,6.47 17.53,2 12,2M14.59,8L12,10.59L9.41,8L8,9.41L10.59,12L8,14.59L9.41,16L12,13.41L14.59,16L16,14.59L13.41,12L16,9.41L14.59,8Z" />
					</svg>
				</button>
			</div>
		</aside>
	{/if}
</main>

<style>
	:host {
		display: block;
		box-sizing: border-box;
		position: relative;
	}

	/* Main layout */
	main {
		display: grid;
		width: 100%;
		height: 100%;
		grid-template-columns: 1fr;
		grid-template-rows: min-content min-content 1fr min-content;
	}

	main.breakpoint-1 {
		grid-template-columns: max-content 1fr;
		grid-template-rows: min-content 1fr min-content;
	}

	.breakpoint-1 #tr-sections {
		grid-row: 1 / 2;
		grid-column: 1 / 3;
	}

	.breakpoint-1 #tr-headings {
		grid-row: 2 / 4;
		grid-column: 1 / 2;
		width: 15rem;
	}

	.breakpoint-1 #tr-text, .breakpoint-1 #tr-nested-list, .breakpoint-1 #tr-metadata {
		grid-row: 2 / 3;
		grid-column: 2 / 3;
	}

	.breakpoint-1 #tr-footnote {
		grid-row: 3 / 4;
		grid-column: 2 / 3;
	}

	#tr-loading {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
		z-index: 10;
	}

	/* Generic styling */
	nav ol {
		margin: 0;
		padding: 0;
		display: flex;
	}

	nav ol li {
		list-style-type: none;
	}

	nav ol li button {
		width: 100%;
	}

	button {
		display: block;
		border: 0;
		background: transparent;
		cursor: pointer;
		box-sizing: border-box;
		text-align: left;
		color: inherit;
		padding: 0.2rem 0.5rem;
	}

	button svg {
		width: 1.5rem;
		height: 1.5rem;
	}

	/* Loading styling */
	#tr-loading svg {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	/* Sections nav styling */
	#tr-sections {
		display: flex;
		flex-direction: row;
	}

	#tr-sections ol {
		flex-direction: column;
		flex: 1 1 auto;
	}

	#tr-sections > button {
		flex: 0 0 auto;
		align-self: flex-start;
		padding-top: 0.2rem;
	}

	.breakpoint-1 #tr-sections ol {
		flex-direction: row;
	}

	#tr-sections button {
		font-size: 90%;
	}

	#tr-sections button svg {
		width: 1.3rem;
		height: 1.3rem;
	}

	/* Headings nav styling */
	#tr-headings {
		display: flex;
		flex-direction: row;
	}

	#tr-headings ol {
		flex-direction: column;
		flex: 1 1 auto;
		overflow: auto;
	}

	#tr-headings > button {
		display: block;
		flex: 0 0 auto;
		background: transparent;
		border: 0;
		padding: 0.2rem 0.3rem;
		align-self: flex-start;
	}

	#tr-headings svg {
		width: 1rem;
		height: 1rem;
	}

	/* Text styling */
	#tr-text {
		padding: 0 0.5rem;
		overflow: auto;
	}

	/* Nested-List styling*/
	#tr-nested-list {
		padding: 0 0.5rem;
		overflow: auto;
	}

	#tr-nested-list section {
		margin-bottom: 0.5rem;
	}

	/* Metadata styling */
	#tr-metadata {
		padding: 0 0.5rem;
		overflow: auto;
	}

	/* Footnote styling */
	#tr-footnote {
		padding: 0.2rem 0.3rem;
		display: flex;
		flex-direction: row;
	}

	#tr-footnote button {
		border: 0;
		background: transparent;
		cursor: pointer;
	}

	#tr-footnote > div:nth-child(1) {
		flex: 1 1 auto;
	}

	#tr-footnote > div:nth-child(2) {
		flex: 0 0 auto;
		align-self: flex-start;
	}

</style>
