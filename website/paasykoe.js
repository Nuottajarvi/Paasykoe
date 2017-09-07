(function(){
	var app = angular.module('paasykoe', []);
			
	app.controller('PaasykoeController', ['$http', '$scope', '$location',  function ($http, $scope, $location){
		$scope.hameensanomat = false;
		$scope.mobile = false;
		$(window).resize(function(){
	   		$scope.$apply(function(){
	        	if(window.innerWidth < 1000){
	        		$scope.mobile = true;
	        	}else{
	        		$scope.mobile = false;
	        	}
		    });
		});

		if(window.innerWidth < 1000){
    			$scope.mobile = true;
	    	}else{
    			$scope.mobile = false;
    		}
		
		//GENERAL
		$scope.tab = 0;
		$scope.setTab = function(tab){
			$scope.tab = tab;
		}

		//QUESTIONS

		$scope.demoMode = false;

		$scope.question = "";
		$scope.a = "";
		$scope.b = ""; 
		$scope.c = "";
		$scope.d = "";
		$scope.correctanswer = 'e';
		$scope.explanationWrong = "";
		$scope.explanationCorrect = "";

		//EXAM
		$scope.examQuestions = [];

		$scope.selectedSubjects = [true, true, true, true];
		$scope.examSelectedAnswers = [];
		$scope.score = "";
		
		$scope.selectAnswer = function(option, examQuestion){
			
			if(examQuestion != undefined){

				if($scope.isSelected(option, examQuestion)){
					$scope.examSelectedAnswers[examQuestion] = null;
				}else{
					$scope.examSelectedAnswers[examQuestion] = option;
				}
				return;
			}

			$scope.selectedAnswer = option;
			
			if(option.toLowerCase() === $scope.correctanswer.toLowerCase()){
				$scope.feedbackTab = 2; 
			}else{
				$scope.feedbackTab = 1;
			}	
		};

		$scope.changeSubject = function(option){

			$scope.selectedSubjects[option] = !$scope.selectedSubjects[option];

			console.log($scope.selectedSubjects);
		};

		$scope.isSelected = function(option, examQuestion){

			if(examQuestion != undefined){
				if(option === $scope.examSelectedAnswers[examQuestion]){
					return true;
				}else{
					return false;
				}
			}

			if(option === $scope.selectedAnswer){
				return true;
			}else{
				return false;
			}
		};

		$scope.id = 1;
		$scope.getNewQuestion = function(){

			var address;

			if($scope.demoMode){
				address = '/demoquestion';
			}else{
				address = '/question';
			}

			var db = "kauppatiede";

			$http.post(address, {"db": db, "selectedSubjects":$scope.selectedSubjects ,"token":window.localStorage.getItem("PaasykoeToken"), "token2":window.localStorage.getItem("PaasykoeToken2"), "id": $scope.id}).success(function (data, status, headers, config){
				if($scope.question == data[0].question)
					$scope.getNewQuestion();
				$scope.selectedAnswer =	null;
				$scope.feedbackTab = 0;
				$scope.question = data[0].question;
				$scope.a = data[0].answerA;
				$scope.b = data[0].answerB;
				$scope.c = data[0].answerC;
				$scope.d = data[0].answerD;
				$scope.correctanswer = data[0].correctAnswer;
				$scope.explanationWrong = data[0].explanationWrong;
				$scope.explanationCorrect = data[0].explanationCorrect;
				$scope.image = data[0].image;
				$scope.id++;
				if($scope.id == 5){
					$scope.id = 1;
				}	
			}).error(function (data, status, headers, config){
				$scope.logout();
				$scope.setTab(3);
				$scope.infoMessage = data;	
			});
		};

		$scope.getExam = function(){
			$scope.score = "";
			$scope.examSelectedAnswers = [];
				
			var address = '/exam';

			var db = "kauppatiede";

			$http.post(address, {"db": db ,"token":window.localStorage.getItem("PaasykoeToken"), "token2":window.localStorage.getItem("PaasykoeToken2"), "id": $scope.id}).success(function (data, status, headers, config){
				$scope.selectedAnswer =	null;
				$scope.examQuestions = data;
			}).error(function (data, status, headers, config){
				$scope.logout();
				$scope.setTab(3);
				$scope.infoMessage = data;	
			});
		};

		$scope.checkExam = function(){
			var score = 0;
			for(i = 0; i < 40; i++){
				if($scope.examSelectedAnswers[i] === $scope.examQuestions[i].correctAnswer.toLowerCase()){
					score++;
				}else if($scope.examSelectedAnswers[i]){
					score-=0.5;
				}
			}

			$scope.score = score;
		};

		$scope.setDemomode = function(state){
			$scope.demoMode = state;
		};

		//LOGIN

		$scope.changePasswordMode = false;

		$scope.setChangePasswordMode = function(state){
			$scope.changePasswordMode = state;
		};

		$scope.messageSent = false;
	
		$http.post('/email', {"token":window.localStorage.getItem("PaasykoeToken")}).success(function(response){
			$scope.email = response;
			if(response == ""){
				$scope.loggedIn = false;
			}else{
				$scope.loggedIn = true;
			}
		}).error(function(response){
			$scope.loggedIn = false;
		});		

		$scope.creatingAccount = false;
		$scope.infoMessage = "";
		
		$scope.openCreateAccount = function(){
			$scope.creatingAccount = true;
			$scope.infoMessage = "";
		};
		
		$scope.cancelAccountCreation = function(){
			$scope.creatingAccount = false;
			$scope.infoMessage = "";
		};
		
		$scope.openResetPassword = function(){
			$scope.resetingPassword = true;
			$scope.infoMessage = "";
		};
		
		$scope.cancelResetPassword = function(){
			$scope.resetingPassword = false;
			$scope.infoMessage = "";
		};
		
		$scope.createAccount = function(data){
			var email = data.email;
			var emailCheck = data.emailCheck;
			var password = data.password;
			var passwordCheck = data.passwordCheck;
			
			if(password.length < 4){
				$scope.infoMessage = "salasanan täytyy olla vähintään 5 merkkiä pitkä";
				password = "";
				passwordCheck = "";
				return;
			}if(password != passwordCheck){
				$scope.infoMessage = "salasanat eivät täsmää";
				password = "";
				passwordCheck = "";
				return;
			}else if(email === undefined){
				$scope.infoMessage = "sähköpostiosoite on virheellinen";
				password = "";
				passwordCheck = "";
				return;
			}else if(email != emailCheck){
				$scope.infoMessage = "sähköpostiosoitteet eivät täsmää";
				email = "";
				emailCheck = "";
				return;
			}else{
				$scope.infoMessage = "";
				var hash = CryptoJS.SHA1(email + password + "~merisuola¤");
				password = "";
				passwordCheck = "";
				$http.post('/createaccount', {"email":email, "hash":hash, "marketingresearch":data.marketingresearch}).
					success(function(data, status, headers, config) {
						$scope.infoMessage = "Käyttäjän luonti onnistui";
						$scope.creatingAccount = false;
					}).
					error(function(data, status, headers, config) {
						$scope.infoMessage = data;
					});
			}
		};
		
		$scope.sendEmailRequest = function(data){
			$http.post('/sendcode', {"email":data.email})
				.success(function(data, status, headers, config){
					$scope.infoMessage = data;
				}).error(function(data, status, headers, config){
					$scope.infoMessage = data;
				});
			$scope.messageSent = true;
		};
		
		$scope.alertReasons = function(){
			alert("Muistithan tarkastaa myös roskapostikansiosi? Joskus sähköpostin tulemisessa saattaa myös kestää hetki." +
			"Tarkista myös että sähköpostiosoitteesi on kirjoitettu oikein. Mikäli mikään edellä mainituista ei auta lähetä viestiä ylläpidolle");
		}
		
		$scope.recoverPassword = function(data){
			var password = data.password;
			var passwordCheck = data.passwordCheck;
			
			if(password != passwordCheck){
				$scope.infoMessage = "salasanat eivät täsmää";
				password = "";
				passwordCheck = "";
				return;
			}
			
			var hash = CryptoJS.SHA1(data.email + password + "~merisuola¤");
		
			$http.post('/changePassword', {
				"email":data.email,
				"code": data.code,
				"hash": hash,
			}).success(function(data, status, headers, config){
				$scope.infoMessage = "salasana vaihdettu";
			}).error(function(data, status, headers, config){
				$scope.infoMessage = data;
			});
		};
		
		$scope.changePassword = function(data){
			var password = data.password;
			var passwordCheck = data.passwordCheck;
			
			if(password != passwordCheck){
				$scope.infoMessage = "salasanat eivät täsmää";
				password = "";
				passwordCheck = "";
				return;
			}
			
			$http.post('/email', {"token":window.localStorage.getItem("PaasykoeToken")}).
			success(function(emaildata,status,headers,config){
				var oldhash = CryptoJS.SHA1(emaildata + data.oldPassword + "~merisuola¤");
				var hash = CryptoJS.SHA1(emaildata + password + "~merisuola¤");
			
				$http.post('/changePassword', {
					"email":emaildata,
					"oldhash": oldhash,
					"hash": hash,
				}).success(function(data, status, headers, config){
					$scope.infoMessage = "salasana vaihdettu";
					alert("Salasana vaihdettu");
				}).error(function(data, status, headers, config){
					$scope.infoMessage = data;
				});
			}).error(function(data,status,headers,config){
				$scope.infoMessage = "palvelimelle ei juuri nyt saada yhteyttä";
			});
			
			
		};
		
		$scope.login = function(data){
			var email = data.email;
			var password = data.password;

			if(email === undefined){
				$scope.infoMessage = "sähköposti on virheellinen";
				password = "";
				passwordCheck = "";
				return;
			}else{
				$scope.infoMessage = "";
				var hash = CryptoJS.SHA1(email + password + "~merisuola¤");
				password = "";
				passwordCheck = "";
				$http.post('/authenticate', {"email":email, "password":hash}).
				success(function(data, status, headers, config) {
					$scope.loggedIn = true;
					window.localStorage.setItem("PaasykoeToken", data.token);
					window.localStorage.setItem("PaasykoeToken2", data.token2);
					$scope.infoMessage = "";
					$scope.email = email;
					if($scope.purchaseMode){
						$http.post('/checkpaid', {"token":window.localStorage.getItem("PaasykoeToken")}).success(function(response){
							$scope.paid = response;
							if($scope.paid){
								$scope.setTab(1);
								$scope.demoMode = false;
								$scope.getNewQuestion();
							}else{
								$scope.setTab(2);
								$scope.purchaseMode = false;
							}
						}).error(function(response){
							$scope.paid = false;
							$scope.setTab(2);
							$scope.purchaseMode = false;
						});

					}else{
						$http.post('/checkpaid', {"token":window.localStorage.getItem("PaasykoeToken")}).success(function(response){
							$scope.paid = response;
							if($scope.paid){
								$scope.setTab(1);
								$scope.demoMode = false;
								$scope.getNewQuestion();
							}else{
								$scope.setTab(0);
							}
						}).error(function(response){
							$scope.paid = false;
							$scope.setTab(0);
						});
					}
				}).
				error(function(data, status, headers, config) {
					$scope.infoMessage = data.message;
					$scope.loggedIn = false;
					$scope.paid = false;
				});
			}
		};
		
		$scope.logout = function(){
			window.localStorage.removeItem("PaasykoeToken");
			$scope.loggedIn = false;
			$scope.paid = false;
			$scope.setTab(0);
		}
		
		function getParameterByName(name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
			results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		}

		$scope.purchaseMode = false;

		$scope.setPurchaseMode = function(state){
			$scope.purchaseMode = true;
			if($scope.loggedIn){
				$scope.infoMessage = "Varmista vielä käyttäjätunnuksesi kirjautumalla sisään";
				$scope.loginInfo.email = "";
				$scope.loginInfo.password = "";
			}
		}

		//PAYMENT

		$http.post('/checkpaid', {"token":window.localStorage.getItem("PaasykoeToken")}).success(function(response){
			$scope.paid = response;		
			if($scope.paid){
				$scope.getNewQuestion();
			}
		}).error(function(response){
			$scope.paid = false;
		});
	
		$scope.createPayment = function(client){

			if(!client.terms){
				window.alert("Sinun täytyy hyväksyä käyttöehdot");
				return;
			}
						
			client.email = $scope.email;
			
			$scope.info = $http.post('/createPayment', {client: client})
			.success(function(response){
				document.location.href = response.url;
			}).error(function(error){
				$scope.infoMessage = error;
			});	
		};

		$scope.notifysuccesful = "maksuasi käsitellään. odota hetki..."
		
		$scope.notify = function(){
			$http.get('/notification?' + window.location.search.split('?')[1]
			).then(function(response){
				$scope.notifysuccesful = response.data.message;
			},function(response){
				$scope.notifysuccesful = response.data.message;				
			});
		};

		$scope.givingFeedback = false;

		$scope.sendFeedback = function(feedback){
			$http.post('/feedback', {"token":window.localStorage.getItem("PaasykoeToken"), "feedback":feedback.feedback}).success(function(response){
				$scope.givingFeedback = false;
				feedback.feedback = "";
			}).error(function(response){
				alert("error: " + response);
			});
		}

	}]);
}

)();

window.onload = function() {
 var noPaste = document.getElementById('noPaste');
 noPaste.onpaste = function(e) {
   e.preventDefault();
 }
}

$(function(){

  var $w = $(window),
      $background = $('#background');

        var isMobile = false; //initiate as false
// device detection
if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|ipad|iris|kindle|Android|Silk|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(navigator.userAgent) 
    || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(navigator.userAgent.substr(0,4))) isMobile = true;

  // Fix background image jump on mobile
  if (isMobile) {
    $background.css({'top': 'auto', 'bottom': 0});

    $w.resize(sizeBackground);
    sizeBackground();
  }

  function sizeBackground() {
     $background.height(screen.height);
  }
});
