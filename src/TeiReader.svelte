<svelte:options tag="tei-reader"/>

<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import deepcopy from 'deepcopy';

	import { ready, load, uiConfig, currentSectionName, currentSection, document, currentFootnote } from './store';
	import { localStoreValue, localLoadValue } from './storage';
import type { TEIMetadataNode } from 'tei-util/dist/types';

	let uiConfigSrc = '';
	let teiSchema = '';
	let teiSrc = '';
	let stylingSrc = '';
	let articleElement = null as HTMLElement;
	let currentHeadingId = '';
	let scrollTrackingTimeout = -1;
	let documentId = '';

	export {teiSchema as teischema, uiConfigSrc as uiconfig, teiSrc as teisrc, stylingSrc as stylingsrc, documentId as documentid};

	onMount(() => {
		load(uiConfigSrc, teiSchema, teiSrc);
	});

	function handleContentClick(ev: Event) {
		if ($currentSection) {
			const target = ev.target as HTMLElement;
			let type = target.getAttribute('data-type');
			if (type) {
				if (type.indexOf('-') >= 0) {
					type = type.substring(type.indexOf('-') + 1);
				}
				if ($currentSection.links) {
					for (let link of $currentSection.links) {
						const linkTarget = target.getAttribute('data-attr-' + link.attr);
						if (link.name === type && linkTarget) {
							window.open(linkTarget, '_blank', 'noopener,noreferrer');
							break;
						}
					}
				}
				if ($currentSection.footnotes) {
					for (let footnote of $currentSection.footnotes) {
						const footnoteTarget = target.getAttribute('data-attr-' + footnote.attr);
						if (footnote.name === type && footnoteTarget && $document[$currentSectionName].nested[footnote.targetName] && $document[$currentSectionName].nested[footnote.targetName][footnoteTarget]) {
							currentFootnote.set($document[$currentSectionName].nested[footnote.targetName][footnoteTarget]);
							break;
						}
					}
				}
			}
		}
	}

	function handleNestedListClick(ev: Event) {
		if ($currentSection) {
			const target = ev.target as HTMLElement;
			let type = target.getAttribute('data-type');
			if (type) {
				if (type.indexOf('-') >= 0) {
					type = type.substring(type.indexOf('-') + 1);
				}
				if ($currentSection.links) {
					for (let link of $currentSection.links) {
						const linkTarget = target.getAttribute('data-attr-' + link.attr);
						if (link.name === type && linkTarget) {
							window.open(linkTarget, '_blank', 'noopener,noreferrer');
							break;
						}
					}
				}
				if ($currentSection.footnotes) {
					for (let footnote of $currentSection.footnotes) {
						const footnoteTarget = target.getAttribute('data-attr-' + footnote.attr);
						if (footnote.name === type && footnoteTarget && $document[$currentSection.sectionName].nested[footnote.targetName] && $document[$currentSection.sectionName].nested[footnote.targetName][footnoteTarget]) {
							const nestedElement = articleElement.querySelector('#' + footnoteTarget);
							if (nestedElement) {
								nestedElement.scrollIntoView();
							}
							break;
						}
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
				}
			}, 50);
		}
	});

	onDestroy(currentSectionUnsubscribe);
</script>

{#if stylingSrc}
	<link rel="stylesheet" href={stylingSrc}/>
{/if}

<main>
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
	<nav id="tr-sections">
		<ol>
			{#if $uiConfig && $uiConfig.sections}
				{#each $uiConfig.sections as section}
					<li><button on:click={() => { selectSection(section.name); }} aria-current={section.name === $currentSectionName ? 'true' : 'false'}>{section.label}</button></li>
				{/each}
			{/if}
		</ol>
	</nav>
	{#if $currentSection && $currentSection.type === 'text' && $document && $document[$currentSectionName] && $document[$currentSectionName].headings.length > 0}
		<nav id="tr-headings">
			<ol>
				{#each $document[$currentSectionName].headings as heading}
					<li><button on:click={() => { scrollToHeading(heading); }} data-level={heading.level} aria-current={heading.id === currentHeadingId ? 'true' : 'false'}>{heading.label}</button></li>
				{/each}
			</ol>
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
		grid-template-columns: max-content 1fr;
		grid-template-rows: min-content 1fr min-content;
	}

	#tr-sections {
		grid-row: 1 / 2;
		grid-column: 1 / 3;
	}

	#tr-headings {
		grid-row: 2 / 4;
		grid-column: 1 / 2;
		width: 15rem;
	}

	#tr-text, #tr-nested-list, #tr-metadata {
		grid-row: 2 / 3;
		grid-column: 2 / 3;
	}

	#tr-footnote {
		grid-row: 3 / 4;
		grid-column: 2 / 3;
		display: flex;
		flex-direction: row;
	}

	#tr-footnote > div:nth-child(1) {
		flex: 1 1 auto;
	}

	#tr-footnote > div:nth-child(2) {
		flex: 0 0 auto;
		align-self: flex-start;
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
		display: block;
		border: 0;
		background: transparent;
		cursor: pointer;
		box-sizing: border-box;
		width: 100%;
		text-align: left;
		color: inherit;
		padding: 0.2rem 0.5rem;
	}

	button svg {
		width: 24px;
		height: 24px;
	}

	/* Loading styling */
	#tr-loading svg {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
	}

	/* Sections nav styling */
	#tr-sections button {
		font-size: 90%;
	}

	/* Headings nav styling */
	#tr-headings ol {
		flex-direction: column;
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
	}

	#tr-footnote button {
		border: 0;
		background: transparent;
		cursor: pointer;
	}
</style>
