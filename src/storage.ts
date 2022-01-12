export interface NestedStorage {
    [x: string]: null | string | number | boolean | NestedStorage | string[];
}

function storeValue(storage: Storage, path: string, value: null | string | number | boolean | NestedStorage | string[]): void {
    let obj = {} as NestedStorage;
    const data = storage.getItem('tei-reader:storage');
    if (data) {
        obj = JSON.parse(data);
    }
    const pathElements = path.split('.');
    let current = obj;
    for (let idx = 0; idx < pathElements.length; idx++) {
        const element = pathElements[idx];
        if (idx === pathElements.length - 1) {
            current[element] = value;
        } else {
            if (!current[element]) {
                current[element] = {};
            }
            current = current[element] as NestedStorage;
        }
    }
    storage.setItem('tei-reader:storage', JSON.stringify(obj));
}

function loadValue(storage: Storage, path: string, defaultValue: null | string | number | boolean | NestedStorage | string[]): null | string | number | boolean | NestedStorage | string[] {
    const data = storage.getItem('tei-reader:storage');
    if (data) {
        const obj = JSON.parse(data) as NestedStorage;
        const pathElements = path.split('.');
        let current = obj;
        for (let idx = 0; idx < pathElements.length; idx++) {
            const element = pathElements[idx];
            if (idx === pathElements.length - 1) {
                if (current[element] !== undefined) {
                    return current[element];
                } else {
                    return defaultValue;
                }
            } else {
                if (current[element]) {
                    current = current[element] as NestedStorage;
                } else {
                    return defaultValue;
                }
            }
        }
    }
    return defaultValue;
}

function deleteValue(storage: Storage, path: string): void {
    let obj = {} as NestedStorage;
    const data = storage.getItem('tei-reader:storage');
    if (data) {
        obj = JSON.parse(data);
    }
    const pathElements = path.split('.');
    let current = obj;
    for (let idx = 0; idx < pathElements.length; idx++) {
        const element = pathElements[idx];
        if (idx === pathElements.length - 1) {
            delete current[element];
        } else {
            if (!current[element]) {
                break;
            }
            current = current[element] as NestedStorage;
        }
    }
    storage.setItem('tei-reader:storage', JSON.stringify(obj));
}

export function sessionStoreValue(path: string, value: null | string | number | boolean | NestedStorage | string[]): void {
    storeValue(sessionStorage, path, value);
}

export function sessionLoadValue(path: string, defaultValue: null | string | number | boolean | NestedStorage | string[]): null | string | number | boolean | NestedStorage | string[] {
    return loadValue(sessionStorage, path, defaultValue);
}

export function sessionDeleteValue(path: string): void {
    return deleteValue(sessionStorage, path);
}

export function localStoreValue(path: string, value: null | string | number | boolean | NestedStorage | string[]): void {
    storeValue(localStorage, path, value);
}

export function localLoadValue(path: string, defaultValue: null | string | number | boolean | NestedStorage | string[]): null | string | number | boolean | NestedStorage | string[] {
    return loadValue(localStorage, path, defaultValue);
}

export function localDeleteValue(path: string): void {
    return deleteValue(localStorage, path);
}
