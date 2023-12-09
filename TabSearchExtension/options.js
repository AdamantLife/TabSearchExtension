async function setupPage(){
    let results = await chrome.storage.local.get(["incog", ]);
    
    document.getElementById("incog").checked = results.incog;

    document.getElementById("incog").addEventListener("change", function(e){
        chrome.storage.local.set({"incog": e.target.checked});
    });
}

(()=>setupPage())();