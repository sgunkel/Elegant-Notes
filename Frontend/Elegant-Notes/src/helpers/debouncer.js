
// https://stackoverflow.com/questions/64990541/how-to-implement-debounce-in-vue3
export const createDebounce = () => {
    let timeout = null;
    return function (fnc, delayMs) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            fnc();
        }, delayMs || 500);
    };
}
