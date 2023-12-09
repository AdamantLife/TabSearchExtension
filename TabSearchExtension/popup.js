let TABS = [];
let INCOG = false;
let LASTVALUE = "";
let SEARCH, RESULTS;

function checkTabEscape(e){
    if(e.key == "Tab"){
        RESULTS.focus();
        RESULTS.firstElementChild?.classList.add('active');
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
    if(e.key == "Escape" && SEARCH.value.length){
        SEARCH.value = "";
        RESULTS.innerHTML = "";
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

async function search(e){
    let search = SEARCH.value;
    if(e.key == "Enter") return getShowTab();
    if(e.key == "ArrowDown" | e.key == "ArrowUp") return navigate(e.key);
    if(search == LASTVALUE) return;
    LASTVALUE = search;
    RESULTS.innerHTML = '';
    if(!search.length) return;
    let matches;
    if(search.toLowerCase() == "playing"){
        matches = await chrome.tabs.query({audible: true});
    }
    else{
        let regex = new RegExp(search, 'i');
        matches = TABS.filter(tab => regex.test(tab.title)||regex.test(tab.url));
    }

    if(!INCOG) matches = matches.filter(tab => !tab.incognito);
    
    matches.forEach(tab => {
        let div = document.createElement('div');
        div.classList.add('result');
        div.innerHTML = `<a data-href="${tab.url}" data-id="${tab.id}" data-window="${tab.windowId}">${tab.title}</a>`;
        div.addEventListener('click', getShowTab);
        RESULTS.appendChild(div);
    });
}

function getShowTab(e){
    let tab;
    if(e){
        tab = e.target;
    }else{
        tab = document.querySelector('.result.active') ?? document.querySelector('.result');
        tab = tab?.querySelector('a');
    }
    if(!tab) return;
    let wid = tab.dataset.window;
    let id = tab.dataset.id;
    chrome.windows.update(parseInt(wid), {focused: true})
        .then(r=>chrome.tabs.update(parseInt(id), {active: true}));
    window.close();
}

function navigate(key){
    let active = document.querySelector('.result.active');
    let target;
    
    if(key == "ArrowDown"){
        target = active?.nextElementSibling;
    }else{
        target = active?.previousElementSibling;
    }
    if(!target) target = document.querySelector('.result');
    if(active) active.classList.remove('active');
    target?.classList.add('active');
    target?.scrollIntoView();
}

(()=>{
    SEARCH = document.getElementById('search-text');
    SEARCH.addEventListener('keydown', checkTabEscape);
    SEARCH.addEventListener('keyup', search);
    RESULTS = document.getElementById('search-results');

    // Using windows.getAll() instead of tabs.getAll() because the latter doesn't
    // indicate Incognito mode
    chrome.windows.getAll({populate: true}, windows=>{
        windows.forEach(window=>{
            window.tabs.forEach(tab=>{
                tab.incognito = window.incognito;
                TABS.push(tab);
            });
        });
    });

    chrome.storage.local.get("incog", r=>INCOG=r.incog);

    window.addEventListener("blur", window.close);
})()