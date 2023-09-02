const express = require('express');
const { get } = require('axios');
const cloneDeep = require('lodash.clonedeep')
const isHexColor = require('../utils/isHexColor')
const baseURL = require('../baseURL')
const COLORS = require('../theme')
const { Error400 } = require('../error_pages')
const bbdcRouter = express.Router();

function handleTheme(COLORS, theme) {
    // 没有主题或者主题不存在
    if (theme === undefined || COLORS[theme] === undefined) {
        return 'default'
    }
    return theme
}

function render(COLORS, theme, data) {
    function handleColorField(param, field) {
        if (data[param] !== undefined) {
            return isHexColor(data[param]) ? '#' + data[param] : data[param]
        }
        return COLORS[theme][field]
    }
    const renderColor = cloneDeep(COLORS)
    renderColor[theme].BORDER = data.hide_border === 'true' ? 0 : COLORS[theme].BORDER
    renderColor[theme].TITLE = handleColorField('title_color', 'TITLE')
    renderColor[theme].TEXT = handleColorField('text_color', 'TEXT')

    return `
<style>
.card {
    width: 382px;
    height: 190px;
    border: 1px solid #000; 
    display: flex;
    align-items: center;
    justify-content: center; 
}
.content {
    padding: 10px;
    font-family: 'Segoe UI', sans-serif;
}
.title {
    font-size: 19px;
    font-weight: 600;
}
.text {
    font-size: 15px;
    font-weight: 600;
}
.value {
    font-size: 13px;
    font-weight: 600;
}
</style>
<div class="card">
    <div class="content">
        <p class="title">${data.nickname}'s不背单词仪表盘</p>
        <p class="text">今日学习</p>
        <p class="value">${data.totalLearn} words</p>
        <p class="text">今日复习</p>
        <p class="value">${data.totalReview} words</p>
        <p class="text">今日学习时长</p>
        <p class="value">${data.totalDuration} mins</p>
    </div>
</div>
`
}

bbdcRouter.get('/bbdc', async (req, res) => {
    const { userId, theme, nickname, hide_border, title_color, text_color } = req.query
    // 如果没有userId，返回404
    if (userId === undefined) {
        return res.status(400).send(new Error400('没有userId').render())
    }
    let totalDuration = 0
    let totalLearn = 0
    let totalReview = 0
    const { data } = await get(`profile/search`, {
        baseURL,
        params: { userId }
    })
    // 不正确的userId
    if (data.result_code === 20000) {
        return res.status(400).send(new Error400('userId不正确').render())
    }
    const { learnList, durationList } = data.data_body
    for (let i = 0, len = learnList.length; i < len; i++) {
        totalDuration += durationList[i].duration
        totalLearn += learnList[i].learnNum
        totalReview += learnList[i].reviewNum
    }
    res.header("Content-Type", "text/html",)
    res.send(render(COLORS, handleTheme(COLORS, theme), { totalDuration, totalLearn, totalReview, nickname: nickname === undefined ? 'leftover' : nickname, hide_border, title_color, text_color }))
})
module.exports = bbdcRouter