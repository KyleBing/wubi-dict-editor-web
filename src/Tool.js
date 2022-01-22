import {shakeDom, shakeDomFocus, log} from './lib/Utility'
import {IS_IN_DEVELOP} from './lib/Global'

import DictOther from './lib/DictOther'
import DictMap from './lib/DictMap'
import Word from './lib/Word'
import { RecycleScroller } from 'vue-virtual-scroller'
import plist from "plist";

export default {
    components: {RecycleScroller: RecycleScroller},
    data() {
        return {
            IS_IN_DEVELOP: IS_IN_DEVELOP, // 是否为开发模式，html 使用
            tip: '', // 提示信息
            dict: {
                deep: true
            }, // 当前词库对象 Dict
            dictMain: {}, // 主码表 Dict
            keyword: '', // 搜索关键字
            code: '',
            word: '',
            activeGroupId: -1, // 组 index
            keywordUnwatch: null, // keyword watch 方法的撤消方法
            labelOfSaveBtn: '保存', // 保存按钮的文本
            heightContent: 0, // content 高度
            words: [], // 显示的 words

            chosenWordIds: new Set(),
            chosenWordIdArray: [], // 对应上面的 set 内容
            lastChosenWordIndex: null, // 最后一次选中的 index

            filePath: '', // 选择的文件路径
            fileName: '', // 选择的文件名
            fileContent: '', // 文件内容，保存用于重新加载用


            targetDict: {}, // 要移动到的码表
            showDropdown: false, // 显示移动词条窗口

            dropdownActiveFileIndex: -1, // 选中的
            dropdownActiveGroupIndex: -1, // 选中的分组 ID

            // 码表配置
            seperatorRead: '\t', // 分隔符
            seperatorSave: '\t', // 分隔符
            seperatorArray: [
                {name: '空格', value: ' ',},
                {name: 'Tab', value: '\t',}
            ], // 分隔符 数组
            dictFormatRead: 'wc', // 码表格式默认值
            dictFormatSave: 'wc', // 码表格式默认值
            dictFormatArray: [
                {name: '一码多词', value: 'cww',},
                {name: '一码一词', value: 'cw',},
                {name: '一词一码', value: 'wc',},
                {name: '纯词', value: 'w',}
            ], // 码表格式数组
            filterCharacterLength: 0, // 筛选词条字数默认值
            filterCharacterLengthArray: [
                {name: '无', value: 0,},
                {name: '一', value: 1,},
                {name: '二', value: 2,},
                {name: '三', value: 3,},
                {name: '四', value: 4,},
                {name: '五+', value: 5,}
            ], // 筛选词条字数数组
            fileNameSave: '', // 显示的保存文件名
            dictMap: null, // main 返回的 dictMap，用于解码词条

            wordEditing: null, // 正在编辑的词条
        }
    },
    mounted() {
        if(IS_IN_DEVELOP) this.filePath = 'C:\\Users\\Administrator\\AppData\\Roaming\\Rime\\origin.txt'

        this.heightContent = innerHeight - 47 - 20 - 10 + 3
        ipcRenderer.on('saveFileSuccess', () => {
            this.labelOfSaveBtn = '保存成功'
            this.tipNotice('保存成功')
            this.$refs.domBtnSave.classList.add('btn-green')
            setTimeout(()=>{
                this.$refs.domBtnSave.classList.remove('btn-green')
                this.labelOfSaveBtn = '保存'
            }, 2000)
        })

        // 获取并设置字典文件
        ipcRenderer.on('setDictMap', (event, fileContent, fileName, filePath) => {
            this.dictMap = new DictMap(fileContent, fileName, filePath)
        })
        ipcRenderer.send('getDictMap')

        this.addKeyboardListener()
        onresize = ()=>{
            this.heightContent = innerHeight - 47 - 20 - 10 + 3
        }
    },
    computed: {
        // 当前显示的 words 数量
        wordsCount(){
            if (this.dict.isGroupMode){
                let countCurrent = 0
                this.words.forEach(group => {
                    countCurrent = countCurrent + group.dict.length
                })
                return countCurrent
            } else {
                return this.words.length
            }
        },
        // 当前载入的是否为 主 码表
        isInMainDict(){
            return this.dict.fileName === 'wubi86_jidian.dict.yaml'
        }
    },

    methods: {
        // load file content
        loadFileContent(event){
            let file = event.target.files[0]
            console.log(file)

            let reader = new FileReader()
            reader.onload = (res) => {
                this.fileContent = res.target.result
                this.filePath = file.name
                this.fileName = file.name
                this.dict = new DictOther(this.fileContent, this.fileName, this.filePath, this.seperatorRead, this.dictFormatRead)
                this.fileNameSave = this.filePathSave()
                this.tipNotice('载入完成')
                // 载入新码表时，清除 word 保存 code
                this.word = ''
                this.refreshShowingWords()

                // ipcRenderer.send('loadMainDict') // 请求主码表文件 // TODO: 码表字典文件
            }
            reader.readAsText(file)
        },

        // 重新载入文件内容
        reloadFileContent(){
            this.dict = new DictOther(this.fileContent, this.fileName, this.filePath, this.seperatorRead, this.dictFormatRead)
            this.fileNameSave = this.filePathSave()
            this.tipNotice('载入完成')
            // 载入新码表时，清除 word 保存 code
            this.word = ''
            this.refreshShowingWords()
        },

        tipNotice(msg){
            this.tip = msg
            setTimeout(()=>{this.tip = ''}, 3000)
        },
        // 确定编辑词条
        confirmEditWord(){
            this.wordEditing = null
        },
        // 生成编辑词条的编码
        generateCodeForWordEdit(){
            if (this.wordEditing){
                this.wordEditing.code = this.dictMap.decodeWord(this.wordEditing.word)
            } else {
                shakeDomFocus(this.$refs.editInputWord)
            }
        },
        // 编辑词条
        editWord(word){
            this.wordEditing = word
        },

        generateCodeForAllWords(){
            this.dict.wordsOrigin.forEach(word => {
                word.setCode(this.dictMap.decodeWord(word.word))
            })
            this.refreshShowingWords()
            this.tipNotice('编码生成完成')
        },
        // 生成保存文件的文件名
        filePathSave(){
            let type = ''
            switch (this.dictFormatSave){
                case 'cww': type = '一码多词';break;
                case 'wc': type = '一词一码';break;
                case 'cw': type = '一码一词';break;
                case 'w': type = '纯词';break;
            }
            let seperater = ''
            switch (this.seperatorSave){
                case ' ': seperater = '空格分隔';break;
                case '\t': seperater = 'Tab分隔';break;
            }
            return type + '_' + seperater + '_' + this.dict.fileName
        },

        // 筛选词条字数
        changeFilterWordLength(length){
            this.filterCharacterLength = parseInt(length)
            this.words = this.dict.getWordsLengthOf(length)
        },
        checkRepetition(includeCharacter){
            this.words = this.dict.getRepetitionWords(includeCharacter)
        },

        select(index, wordId, event){
            if (event.shiftKey){
                if (this.lastChosenWordIndex !== null){
                    let a,b // 判断大小，调整大小顺序
                    if (index > this.lastChosenWordIndex){
                        a = this.lastChosenWordIndex
                        b = index
                    } else {
                        b = this.lastChosenWordIndex
                        a = index
                    }
                    for (let i=a; i<=b; i++){
                        this.chosenWordIds.add(this.words[i].id)
                    }
                }
                this.lastChosenWordIndex = null // shift 选择后，最后一个id定义为没有

            } else {
                if (this.chosenWordIds.has(wordId)){
                    this.chosenWordIds.delete(wordId)
                    this.lastChosenWordIndex = null
                } else {
                    this.chosenWordIds.add(wordId)
                    this.lastChosenWordIndex = index
                }
            }
            this.chosenWordIdArray = [...this.chosenWordIds.values()]
        },
        // 选择移动到的分组 index
        setDropdownActiveGroupIndex(index){
            this.dropdownActiveGroupIndex = index
        },
        // 选择移动到的文件 index
        setDropdownActiveIndex(fileIndex){
            this.dropdownActiveFileIndex = fileIndex
            this.dropdownActiveGroupIndex = -1 // 切换文件列表时，复位分组 fileIndex
            // this.dictSecond = {} // 立即清空次码表，分组列表也会立即消失，不会等下面的码表加载完成再清空
        },
        sort(){
            let startPoint = new Date().getTime()
            this.words.sort((a,b) => a.code < b.code ? -1: 1)
            this.tipNotice('排序完成')
            log(`排序用时 ${new Date().getTime() - startPoint} ms`)
        },
        enterKeyPressed(){
            this.addNewWord()
        },

        // 通过 code, word 筛选词条
        search(){
            this.chosenWordIds.clear()
            this.chosenWordIdArray = []
            this.activeGroupId = -1 // 切到【全部】标签页，展示所有搜索结果
            let startPoint = new Date().getTime()
            if (this.code || this.word){
                this.words = this.dict.wordsOrigin.filter(item => { // 获取包含 code 的记录
                    return item.code.includes(this.code) && item.word.includes(this.word)
                })
                log(`${this.code} ${this.word}: ` ,'搜索出', this.words.length, '条，', '用时: ', new Date().getTime() - startPoint, 'ms')
            } else { // 如果 code, word 为空，恢复原有数据
                this.refreshShowingWords()
            }
        },

        // 刷新 this.words
        refreshShowingWords(){
            this.chosenWordIds.clear()
            this.chosenWordIdArray = []
            this.words = [...this.dict.wordsOrigin]
        },
        addNewWord(){
            if (!this.dict.hasOwnProperty('wordsOrigin')){
                this.dict = new DictOther('临时 jtjf', '临时文件.txt', '临时文件.txt', this.seperatorRead, this.dictFormatRead)
            }
            if (!this.word){
                shakeDomFocus(this.$refs.domInputWord)
            } else if (!this.code){
                shakeDomFocus(this.$refs.domInputCode)
            } else {
                this.dict.addWordToDictInOrder(new Word(this.dict.lastIndex++, this.code, this.word))
                this.refreshShowingWords()
                log(this.code, this.word)
            }
        },
        // 保存内容到文件
        saveToFile(dict, isSaveToOriginalFilePath){
            if (this.dict.lastIndex >= 1){ // 以 dict 的 lastIndex 作为判断有没有加载码表的依据
                if (isSaveToOriginalFilePath){ // 保存到原来文件，针对工具里打开的文件，和词条移动的目标文件
                    this.downloadFile(
                        dict.filePath,
                        dict.toYamlString()
                    )
                } else { // 保存成新文件，新文件名，只针对工具里打开的码表
                    this.downloadFile(
                        this.filePathSave(),
                        this.dict.toExportString(this.seperatorSave, this.dictFormatSave)
                    )
                }
            } else {
                this.tipNotice('未加载任何码表文件')
                log('未加载任何码表文件')
            }
        },
        // 选中全部展示的词条
        selectAll(){
            if(this.wordsCount < 100000){ // 最多同时选择 10w 条数据
                if (this.dict.isGroupMode){
                    this.chosenWordIds.clear()
                    this.chosenWordIdArray = []
                    this.words.forEach(group => {
                        group.forEach( item => {
                            this.chosenWordIds.add(item.id)
                        })
                    })
                } else {
                    this.words.forEach(item => {this.chosenWordIds.add(item.id)})
                }
                this.chosenWordIdArray = [...this.chosenWordIds.values()]
            } else {
                // 提示不能同时选择太多内容
                this.tip = '不能同时选择大于 1000条 的词条内容'
                shakeDom(this.$refs.domBtnSelectAll)
            }
        },
        // 清除内容
        resetInputs(){
            this.chosenWordIds.clear()
            this.chosenWordIdArray = []
            this.code = ''
            this.word = ''
            this.search()
            this.tip = ''
        },
        // 删除词条：单
        deleteWord(wordId){
            this.chosenWordIds.delete(wordId)
            this.chosenWordIdArray = [...this.chosenWordIds.values()]
            this.dict.deleteWords(new Set([wordId]))
            this.refreshShowingWords()
        },
        // 删除词条：多
        deleteWords(){
            this.dict.deleteWords(this.chosenWordIds)
            this.refreshShowingWords()
            this.chosenWordIds.clear() // 清空选中 wordID
            this.chosenWordIdArray = []
        },

        // 词条位置移动
        move(wordId, direction){
            if (this.dict.isGroupMode){
                // group 时，移动 调换 word 位置，是直接调动的 wordsOrigin 中的word
                // 因为 group 时数据为： [{word, word},{word,word}]，是 wordGroup 的索引
                for(let i=0; i<this.words.length; i++){
                    let group = this.words[i]
                    for(let j=0; j<group.dict.length; j++){
                        if (wordId === group.dict[j].id){
                            let tempItem = group.dict[j]
                            if (direction === 'up'){
                                if (j !==0){
                                    group.dict[j] = group.dict[j - 1]
                                    group.dict[j - 1] = tempItem
                                    return ''
                                } else {
                                    log('已到顶')
                                    return '已到顶'
                                }
                            } else if (direction === 'down'){
                                if (j+1 !== group.dict.length){
                                    group.dict[j] = group.dict[j + 1]
                                    group.dict[j + 1] = tempItem
                                    return ''
                                } else {
                                    log('已到底')
                                    return '已到底'
                                }
                            }
                        }
                    }
                }
            } else {
                // 非分组模式时，调换位置并不能直接改变 wordsOrigin 因为 与 words 已经断开连接
                // [word, word]
                for(let i=0; i<this.words.length; i++){
                    if (wordId === this.words[i].id){
                        let tempItem = this.words[i]
                        if (direction === 'up'){
                            if (i !==0) {
                                this.dict.exchangePositionInOrigin(tempItem, this.words[i-1]) // 调换 wordsOrigin 中的词条位置
                                this.words[i] = this.words[i - 1]
                                this.words[i - 1] = tempItem
                                return ''
                            } else {
                                log('已到顶')
                                return '已到顶'
                            }
                        } else if (direction === 'down'){
                            if (i+1 !== this.words.length) {
                                this.dict.exchangePositionInOrigin(tempItem, this.words[i+1]) // 调换 wordsOrigin 中的词条位置
                                this.words[i] = this.words[i + 1]
                                this.words[i + 1] = tempItem
                                return ''
                            } else {
                                log('已到底')
                                return '已到底'
                            }
                        }
                    }
                }
            }
        },

        // 上移词条
        moveUp(id){
            this.tip = this.move(id, 'up')
            let temp = this.words.pop()
            this.words.push(temp)
        },
        // 下移词条
        moveDown(id){
            this.tip = this.move(id, 'down')
            let temp = this.words.pop()
            this.words.push(temp)
        },
        // 判断是否为第一个元素
        isFirstItem(id){
            if (this.dict.isGroupMode){ // 分组时的第一个元素
                for (let i=0; i<this.words.length; i++) {
                    for (let j = 0; j < this.words[i].dict.length; j++) {
                        if (this.words[i].dict[j].id === id){
                            return j === 0 // 使用 array.forEach() 无法跳出循环
                        }
                    }
                }
                return false
            } else {
                for (let i = 0; i < this.words.length; i++) {
                    if (this.words[i].id === id){
                        return i === 0 // 使用 array.forEach() 无法跳出循环
                    }
                }
                return false
            }
        },
        // 判断是否为最后一个元素
        isLastItem(id){
            if (this.dict.isGroupMode){ // 分组时的最后一个元素
                for (let i=0; i<this.words.length; i++) {
                    for (let j = 0; j < this.words[i].dict.length; j++) {
                        if (this.words[i].id === id){
                            return j + 1 === this.words.length
                        }
                    }
                }
                return false
            } else {
                for (let i = 0; i < this.words.length; i++) {
                    if (this.words[i].id === id){
                        return i + 1 === this.words.length
                    }
                }
                return false
            }
        },
        // 绑定键盘事件： 键盘上下控制词条上下移动
        addKeyboardListener(){
            window.addEventListener('keydown', event => {
                // log(event)
                switch( event.key) {
                    case 's':
                        if (event.ctrlKey || event.metaKey){ // metaKey 是 macOS 的 Ctrl
                            this.saveToFile(this.dict)
                            event.preventDefault()
                        } else {

                        }
                        break
                    case 'ArrowDown':
                        if(this.chosenWordIds.size === 1) { // 只有一个元素时，键盘才起作用
                            let id = [...this.chosenWordIds.values()][0]
                            this.moveDown(id)
                        }
                        event.preventDefault()
                        break
                    case 'ArrowUp':
                        if(this.chosenWordIds.size === 1) { // 只有一个元素时，键盘才起作用
                            let id = [...this.chosenWordIds.values()][0]
                            this.moveUp(id)
                        }
                        event.preventDefault()
                        break
                }
            })
        },
        // 将选中的词条移动到指定码表
        moveWordsToTargetDict(){
            let wordsTransferring = this.dict.wordsOrigin.filter(item => this.chosenWordIds.has(item.id)) // 被转移的 [Word]
            log('words transferring：', JSON.stringify(wordsTransferring))

            this.targetDict.addWordsInOrder(wordsTransferring, this.dropdownActiveGroupIndex)

            this.words = [...this.dict.wordsOrigin]
            log('after insert:( main:wordOrigin ):\n ', JSON.stringify(this.targetDict.wordsOrigin))

            this.deleteWords() // 删除当前词库已移动的词条
            this.saveToFile(this.targetDict, true)
            this.saveToFile(this.dict, true)
            this.tipNotice('移动成功')
            this.resetDropList()
        },
        // 复制 dropdown
        resetDropList(){
            this.showDropdown = false
            this.dropdownActiveFileIndex = -1
            this.dropdownActiveGroupIndex = -1
            this.targetDict = {} // 清空次码表
        },
        // 打开当前码表源文件
        openFileInNewTab(){
            let win = window.open()
            win.document.write(`<pre>${this.fileContent}</pre>`)
            win.document.title = this.dict.fileName
        },

        // 导出选中词条到 plist 文件
        exportSelectionToPlist(){
            let wordsSelected = [] // 被选中的 [Word]
            if (this.dict && this.dict.wordsOrigin.length > 0){
                wordsSelected = this.dict.wordsOrigin.filter(item => this.chosenWordIds.has(item.id))
                if (wordsSelected.length < 1){
                    shakeDomFocus(this.$refs.domBtnExportPlist)
                    this.tipNotice('未选择任何词条')
                    return
                }
                let wordsProcessed = wordsSelected.map(item => {
                    return {
                        phrase: item.word,
                        shortcut: item.code
                    }
                })
                let plistContentString = plist.build(wordsProcessed)
                this.downloadFile(this.dict.fileName + '.plist', plistContentString)
            } else {
                this.tipNotice('没有任何词条')
            }
        },

        downloadFile(fileName, data) { // 下载 base64 图片
            let aLink = document.createElement('a')
            let blob = new Blob([data]); //new Blob([content])
            let evt = document.createEvent("HTMLEvents")
            evt.initEvent("click", true, true); //initEvent 不加后两个参数在FF下会报错  事件类型，是否冒泡，是否阻止浏览器的默认行为
            aLink.download = fileName
            aLink.href = URL.createObjectURL(blob)
            aLink.click()
        },
    },
    watch: {
        code(newValue){
            this.code = newValue.replaceAll(/[^A-Za-z ]/g, '') // input.code 只允许输入字母
        },
        word(newValue, oldValue){
            if (newValue.length < oldValue.length){
                // 删除或清空时，不清空编码
            } else {
                if (this.dictMap){
                    this.code = this.dictMap.decodeWord(newValue)
                }
            }
        },
        seperatorSave(){
            this.fileNameSave = this.filePathSave()
        },
        dictFormatSave(){
            this.fileNameSave = this.filePathSave()
        },
        chosenWordIdArray(newValue){
            if (newValue.length === 0){
                this.showDropdown = false
            }
            log('已选词条id: ', JSON.stringify(newValue))
        },
        showDropdown(newValue){
            if (!newValue){ // 窗口关闭时，重置 index
                this.resetDropList()
            }
        },
    },
}
