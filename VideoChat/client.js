//our username 
var name;
var connectedUser;

//connecting to our signaling server
var conn = null;

window.onload = function () {
    init()
}

function init() {
    conn = new WebSocket("ws://localhost:9090")
    // conn = new WebSocket(`ws://${window.location.hostname}:9090`)

    conn.onopen = function () {
        console.log("Connected to the signaling server");
    };

    //when we got a message from a signaling server 
    conn.onmessage = function (msg) {
        console.log("Got message", msg.data);

        var data = JSON.parse(msg.data);

        switch (data.type) {
            case "login":
                handleLogin(data.success);
                break;
            //when somebody wants to call us 
            case "offer":
                handleOffer(data.offer, data.name);
                break;
            case "answer":
                handleAnswer(data.answer);
                break;
            //when a remote peer sends an ice candidate to us 
            case "candidate":
                handleCandidate(data.candidate);
                break;
            case "leave":
                console.log(data)
                // handleLeave();
                break;
            default:
                break;
        }
    };

    conn.onerror = function (err) {
        console.log("Got error", err);
    };
}

//alias for sending JSON encoded messages 
function send(message) {
    //attach the other peer username to our messages 
    if (connectedUser) {
        message.name = connectedUser;
    }

    conn.send(JSON.stringify(message));
};

//****** 
//UI selectors block 
//******

var loginPage = document.querySelector("#loginPage");
var usernameInput = document.querySelector("#usernameInput");
var loginBtn = document.querySelector("#loginBtn");

var callPage = document.querySelector("#callPage");
var callToUsernameInput = document.querySelector("#callToUsernameInput");
var callBtn = document.querySelector("#callBtn");

var hangUpBtn = document.querySelector("#hangUpBtn");

var localVideo = document.querySelector("#localVideo");
// 关闭声音
localVideo.volume = 0
var remoteVideo = document.querySelector("#remoteVideo");

var yourConn;
var stream;

callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) {
    name = usernameInput.value;

    if (name.length > 0) {
        send({
            type: "login",
            name: name
        });
    }

});

function handleLogin(success) {
    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 

        //getting local video stream 
        navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) {
            stream = myStream;

            //displaying local video stream on the page 
            try {
                localVideo.src = window.URL.createObjectURL(stream);
            } catch (error) {
                localVideo.srcObject = stream;
            }

            //using Google public stun server 
            var configuration = {
                "iceServers": [{
                    urls: "stun:82.156.29.177:3478"
                }, {
                    urls: "turn:82.156.29.177:3478",
                    username: "lengmang.net",
                    credential: "lengmang.net"
                }]
            };

            yourConn = new webkitRTCPeerConnection(configuration);

            // setup stream listening 
            yourConn.addStream(stream);

            //when a remote user adds stream to the peer connection, we display it 
            yourConn.onaddstream = function (e) {
                try {
                    remoteVideo.src = window.URL.createObjectURL(e.stream);
                } catch (error) {
                    remoteVideo.srcObject = e.stream;
                }
            };

            // Setup ice handling 
            yourConn.onicecandidate = function (event) {
                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate
                    });
                }
            };

        }, function (error) {
            console.log(error);
        });

    }
};

//initiating a call 
callBtn.addEventListener("click", function () {
    var callToUsername = callToUsernameInput.value;

    if (callToUsername.length > 0) {

        connectedUser = callToUsername;

        // create an offer 
        yourConn.createOffer(function (offer) {
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);
        }, function (error) {
            console.error(error)
            alert("Error when creating an offer");
        });

    }
});

//when somebody sends us an offer 
function handleOffer(offer, name) {
    connectedUser = name;
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));

    //create an answer to an offer 
    yourConn.createAnswer(function (answer) {
        yourConn.setLocalDescription(answer);

        send({
            type: "answer",
            answer: answer
        });

    }, function (error) {
        alert("Error when creating an answer");
    });
};

//when we got an answer from a remote user
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up 
hangUpBtn.addEventListener("click", function () {

    send({
        type: "leave"
    });

    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.src = null;

    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;

    conn.close();
    init();

    loginPage.style.display = "block";
    callPage.style.display = "none";
};