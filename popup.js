let btn = document.getElementById("checkComments");

// When the button is clicked, inject setPageBackgroundColor into current page
btn.addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: checkComments,
    });     
});  

// The body of this function will be executed as a content script inside the
// current page
function checkComments() {
    function findBlockID(element) {
        const parent = element.parentElement
        if (!parent) return ""
        if (parent.hasAttribute('data-block-id')) {
            return parent.getAttribute('data-block-id')
        }
        return findBlockID(parent)
    }
    
    let pageID
    let s = document.URL.split("-")
    if (s.length < 2) {
        console.error("Could not find page ID. Am I running on notion.so?")
        return
    }
    pageID = s[s.length-1]

    chrome.storage.local.get([pageID], function(result) {
        let cached = {}
        let newPage = false
        if (result && result[pageID]) {
            cached = result[pageID]
            
        } else {
            newPage = true
        }
        
        let current = {}
        let bubbles = document.getElementsByClassName("speechBubble")
        for (const i in bubbles) {
            bubble = bubbles[i]
            if (!bubble.nextSibling) continue
            let blockID = findBlockID(bubble)
            if (blockID == "") continue
            let count = 0
            let valueElem
            if (bubble.nextSibling.nodeValue) {
                count = bubble.nextSibling.nodeValue
                valueElem = bubble.parentElement
            } else {
                count = bubble.nextSibling.firstChild.firstChild.nodeValue
                valueElem = bubble.nextSibling.firstChild
            }
            current[blockID] = count
            
            if (!newPage && (!cached[blockID] || cached[blockID] != count)) {
                console.log("updated ", blockID)
                bubble.style.fill = 'green';
                valueElem.style.color = 'black'
                bubble.parentElement.style.backgroundColor = 'rgba(0, 255, 0, 0.2)'
            }
        }

        let toSave = {}
        toSave[pageID] = current
        chrome.storage.local.set(toSave)
    });
}
