// Page elements:
let questionViewWrap = document.getElementById('questionViewWrap')
let userInfo = document.getElementById('userInfo')
let questionNumber = document.getElementById('questionNumber')
let questionContent = document.getElementById('questionContent')
let greetBox = document.getElementById('greetBox')
let answer1 = document.getElementById('answer1')
let answer2 = document.getElementById('answer2')
let answer3 = document.getElementById('answer3')
let answer4 = document.getElementById('answer4')
let userName = document.getElementById('greetBoxUsernameInput')
let greetBoxPlayAsGuestButton = document.getElementById('greetBoxPlayAsGuestButton')
let greetBoxPlayButton = document.getElementById('greetBoxPlayButton')
let popupWrap = document.getElementById('popupWrap')
let popupMessageUsername = document.getElementById('popupMessageUsername')
let popupMessageScore = document.getElementById('popupMessageScore')
let popupMessageStreak = document.getElementById('popupMessageStreak')
let notification = document.getElementById('notify')
let notifyTitle = document.getElementById('notify_title')
let notifyWrap = document.getElementById('wrap')
let questionType = document.getElementById('trivia_category')
let questionDiff = document.getElementById('trivia_difficulty')

let currentQuestion = {}
let userObject = {}

let InitialScript = () => {
  checkLoginStatus((status) => {
    if (status === true) {
      userName.style.display = 'none'
      greetBoxPlayAsGuestButton.style.display = 'none'
      greetBoxPlayButton.style.display = 'inline-block'
    } else {
      userName.style.display = 'inline-block'
      greetBoxPlayAsGuestButton.style.display = 'inline-block'
      greetBoxPlayButton.style.display = 'none'
    }
  })
}

let assessQuestionResult = (chosenAnswer) => {
  serverRequest('POST', '/validateanswer', `chosenAnswer=${chosenAnswer}`, (xmlhttp) => {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      let xmlhttpResult = JSON.parse(xmlhttp.responseText)
      userObject = xmlhttpResult.currentUser
      rightanswer = xmlhttpResult.answer
      if (xmlhttpResult.result === true) {
        displayNotification('right', rightanswer)
      } else {
        displayNotification('wrong', rightanswer)
      }
      populatePopupResult()
    }
  })
}

let storeQuizResult = () => {
  serverRequest('POST', '/storeuser', '', (xmlhttp) => {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 201) {
      swal('Success', 'Your score has been saved!', 'success')
    } else {
      swal('Error', 'Unknown error!', 'error')
    }
  })
  
}

let play = () => {
  checkLoginStatus((status) => {
    if (status) {
      if (questionType.options[questionType.selectedIndex].value !== '-1' && questionDiff.options[questionDiff.selectedIndex].value !== '-1') {
        serverRequest('POST', '/play', '', (xmlhttp) => {
          if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
            userObject = JSON.parse(xmlhttp.responseText)
            notifyTitle.innerHTML = `Welcome ${userObject.username}`
            document.getElementById('tooltip').style.backgroundImage = 'url(/assets/images/icons/puzzle.svg)'
            userObject = JSON.parse(xmlhttp.responseText)
            startTrivia()
          }
        })
      } else {
        swal('Error!', 'Please fill out everything!', 'warning')
      }
    } else {
      // swal('Error!', 'Unexpected request!\nPlease reload the page', 'warning')
    }
  })
}

/**
 *
 * @param {number} - ????
 */
let playAsGuest = (event = 1) => {
  checkLoginStatus((status) => {
    if (!status) {
      if (event === 1 || event.keyCode === 13) {
        if (userName.value !== '' && questionType.options[questionType.selectedIndex].value !== '-1' && questionDiff.options[questionDiff.selectedIndex].value !== '-1') {
          serverRequest('POST', '/playAsGuest', `username=${userName.value}`, (xmlhttp) => {
            if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
              userObject = JSON.parse(xmlhttp.responseText)
              notifyTitle.innerHTML = `Welcome ${userObject.username}`
              document.getElementById('tooltip').style.backgroundImage = 'url(/assets/images/icons/puzzle.svg)'
              userObject = JSON.parse(xmlhttp.responseText)
              startTrivia()
            }
          })
        } else {
          swal('Error!', 'Please fill out everything!', 'warning')
        }
      }
    } else {
      swal('Error!', 'Unexpected request!\nPlease reload the page', 'warning')
    }
  })
}

/**
 * @desc Displays the current user's name to the popup message Username along with their current Score and Highest Streak
 *
 */
let populatePopupResult = () => {
  popupMessageUsername.innerHTML = userObject.username
  popupMessageScore.innerHTML = `SCORE: ${userObject.currentScore.userScore}`
  popupMessageStreak.innerHTML = `HIGHEST STREAK: ${userObject.currentScore.highestStreak}`
}
/**
 * @desc function displays the next question or the result when the game is over
 */
let getNextQuestion = () => {
  questionViewWrap.style.backgroundColor = 'rgba(38, 50, 56, 1)'
  serverRequest('POST', '/getnextquestion', '', (xmlhttp) => {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      currentQuestion = JSON.parse(xmlhttp.responseText)
      displayQuestion()
      greetBox.style.opacity = '0'
      setTimeout(() => {
        greetBox.style.display = 'none'
      }, 300)
    } else if (xmlhttp.readyState === 4 && xmlhttp.status === 204) {
      questionViewWrap.style.top = '-100vh'
      notifyWrap.style.display = 'block'
      notification.style.right = '0'
      setTimeout(() => {
        notification.style.right = '-100%'
        setTimeout(() => {
          notifyWrap.style.display = 'none'
        }, 300)
      }, 1200)
      swal({
        title: "Bonus Question!!",
        text: "Do you want to answer a user-created bonus question?\nYou can double the score or lose it all!",
        icon: "warning",
        dangerMode: true,
        buttons: ["Oh noez!", "Aww yiss!"],
      }).then((doBonus) => {
        if (doBonus) {
          playBonus()
        } else {
          storeQuizResult()
          popupWrap.style.top = '50vh'
        }
      })
    } else if (xmlhttp.readyState === 4 && xmlhttp.status === 401) {
      questionViewWrap.style.top = '-100vh'
      notifyWrap.style.display = 'block'
      notification.style.right = '0'
      setTimeout(() => {
        notification.style.right = '-100%'
        setTimeout(() => {
          notifyWrap.style.display = 'none'
        }, 300)
      }, 1200)
      storeQuizResult()
      popupWrap.style.top = '50vh'
    }
  })
}

let playBonus = () => {
  serverRequest('POST', '/getbonusquestion', '', (xmlhttp) => {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      currentQuestion = JSON.parse(xmlhttp.responseText)
      console.log(currentQuestion)
      displayNotification('beer')
      displayQuestion()
      questionViewWrap.style.backgroundColor = 'rgba(255, 102, 0,1)'
    }
  })
}

/**
 * @desc Opens new HTTP request and looks for POST "/getquestions", if there is a state change, then it will parse into a JSON object which is displayed back to the user in the greet Box which only shows for 0.3 seconds then dissapears. Send quiz category and difficulty value to back end.
 */
let startTrivia = () => {
  serverRequest('POST', '/starttrivia', `chosenType=${questionType.options[questionType.selectedIndex].value}&chosenDiff=${questionDiff.options[questionDiff.selectedIndex].value}`, (xmlhttp) => {
    if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
      currentQuestion = JSON.parse(xmlhttp.responseText)
      displayQuestion()
      greetBox.style.opacity = '0'
      setTimeout(() => {
        greetBox.style.display = 'none'
      }, 300)
    }
  })
}

/**
 * @desc Displays a game question
 */
let displayQuestion = () => {
  notifyWrap.style.display = 'block'
  questionViewWrap.style.top = '-100vh'
  countDownTimer()
  moveBar()
  setTimeout(() => {
    notification.style.right = '0'
  }, 1)
  setTimeout(() => {
    userInfo.innerHTML = `${userObject.username} - ${userObject.currentScore.userScore}`
    questionNumber.innerHTML = 'QUESTION ' + (currentQuestion.index + 1)
    questionContent.innerHTML = currentQuestion.question
    answer1.innerHTML = currentQuestion.option1
    answer2.innerHTML = currentQuestion.option2
    answer3.innerHTML = currentQuestion.option3
    answer4.innerHTML = currentQuestion.option4
    questionViewWrap.style.top = '45vh'
    notification.style.right = '-100%'
    setTimeout(() => {
      notifyWrap.style.display = 'none'
    }, 300)
  }, 1000)
}

/**
 * @desc Displays a pop up notifying if the answer was right or wrong
 * @param {string} mode - refers to user answer right/wrong
 */
let displayNotification = (mode, answer) => {
  let thumbUp = 'url(/assets/images/icons/thumb-up.svg)'
  let thumbDown = 'url(/assets/images/icons/dislike.svg)'
  let beer = 'url(/assets/images/icons/beer.svg)'
  if (mode === 'wrong') {
    notifyTitle.innerHTML = '<div> Wrong! Right Answer Is\n'+answer +'</div>'
    document.getElementById('tooltip').style.backgroundImage = thumbDown
  } else if (mode === 'right') {
    notifyTitle.innerHTML = 'Good Job! :)'
    document.getElementById('tooltip').style.backgroundImage = thumbUp
  } else if (mode === 'beer') {
    notifyTitle.innerHTML = 'Good Luck!!!'
    document.getElementById('tooltip').style.backgroundImage = beer
  }
}

InitialScript()
