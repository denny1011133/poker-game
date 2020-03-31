//定義遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}

const Symbols = [
  'https://image.flaticon.com/icons/svg/105/105223.svg', // 黑桃
  'https://image.flaticon.com/icons/svg/445/445058.svg', // 愛心
  'https://image.flaticon.com/icons/svg/445/445061.svg', // 方塊
  'https://image.flaticon.com/icons/svg/105/105219.svg' // 梅花
]


//洗牌 產生隨機亂數陣列
const utility = {
  getRandomNumberArray(count) { //count:52
    const number = Array.from(Array(count).keys()) //[0,1,2,3,4,5,6,7,8,9....,51]
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1))
        ;[number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number //[32,40,2,8,15,5..]
  },

}
const controller = {
  currentState: GAME_STATE.FirstCardAwaits,//初始狀態
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },
  //依照當下的遊戲狀態，發派工作給 view 和 model。
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return //如果點到牌面向上的卡片就不要執行翻牌動作
    }
    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits://當是第一次翻牌的狀態時
        view.flipCards(card)
        model.revealedCards.push(card) //裡面只有一張
        this.currentState = GAME_STATE.SecondCardAwaits //轉成等待第二張牌的狀態
        break
      case GAME_STATE.SecondCardAwaits://當是第二次翻牌的狀態時
        view.renderTriedTimes(++model.triedTimes)
        view.flipCards(card)
        model.revealedCards.push(card) //裡面有兩張
        if (model.isRevealedCardsMatched()) {
          // 配對成功
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMatched
          view.pairCards(...model.revealedCards)
          model.revealedCards = [] //清空暫存
          if (model.score === 260) {
            console.log('showGameFinished')
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()  // 加在這裡
            return
          }
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          view.appendWrongAnimation(...model.revealedCards)
          setTimeout(this.resetCards, 1000)
        }
        break
    }
  },
  resetCards() {
    view.flipCards(...model.revealedCards)
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }
}
const model = {
  revealedCards: [],
  //進入第二次翻牌的狀態時，檢查兩張牌的配對
  isRevealedCardsMatched() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },
  score: 0,
  triedTimes: 0
}
const view = {

  getCardElement(index) {
    return `<div data-index="${index}" class="card back"></div>` //補上data-index
  },
  //渲染牌面
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" />
      <p>${number}</p>
    `
  },
  //處理J Q K A
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  //顯示52張牌的function (全是牌背)
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards')
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join('')
  },
  //翻牌動作
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      card.classList.add('back')
      card.innerHTML = null
    })
  },
  //改變卡片底色樣式
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  renderScore(score) {
    document.querySelector(".score").innerHTML = `Score: ${score}`;
  },
  renderTriedTimes(times) {
    document.querySelector(".tried").innerHTML = `You've tried: ${times} times`;
  },
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => event.target.classList.remove('wrong'), { once: true })
    })
  },
  showGameFinished() {
    const div = document.createElement('div')
    div.classList.add('completed')
    div.innerHTML =
      `<p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>`

    const header = document.querySelector('#header')
    header.before(div)
  }

}

//首先第一步驟是要在牌面上顯示52張牌
controller.generateCards()

//每張卡片加上事件監聽器
document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', () => {
    controller.dispatchCardAction(card)
  })
})