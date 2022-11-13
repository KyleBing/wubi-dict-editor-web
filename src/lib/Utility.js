function $(selector){
    return document.querySelector(selector)
}

// 抖动 dom 元素
function shakeDom(dom){
    let animateClass = 'shake';
    dom.classList.add('animated');
    dom.classList.add(animateClass);
    setTimeout(()=>{
        dom.classList.remove('animated')
        dom.classList.remove(animateClass)
    }, 250)
}

// 抖动 dom 元素 并 聚焦
function shakeDomFocus(dom){
    let animateClass = 'shake';
    dom.classList.add('animated');
    dom.classList.add(animateClass);
    setTimeout(()=>{
        dom.classList.remove('animated')
        dom.classList.remove(animateClass)
    }, 250)
    dom.focus()
}

/**
 * 数组乱序算法
 * @param arr
 * @return {*}
 */
function shuffle(arr) {
    let length = arr.length,
        r = length,
        rand = 0;

    while (r) {
        rand = Math.floor(Math.random() * r--);
        [arr[r], arr[rand]] = [arr[rand], arr[r]];
    }
    return arr;
}


// 获取字符串的实际 unicode 长度，如：一个 emoji 表情的正确长度应该为 1
function getUnicodeStringLength(str){
    let wordLength = 0
    for(let letter of str){
        wordLength = wordLength + 1
    }
    return wordLength
}

function log(...obj){
    console.log(...obj)
}

module.exports = {
    shakeDom, shakeDomFocus, log, getUnicodeStringLength, shuffle
}
