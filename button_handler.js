var toggle_status = 0;

initialize();

var bAnalyze = document.getElementById("analyze");

bAnalyze.addEventListener("click", bAnalyzeHandler);

function bAnalyzeHandler()
{
    var mc = document.getElementById("main_code").value;
    var sw = document.getElementById("sw_code").value;
    var ac = document.getElementById("analysis_code").value;
    
    if(mc.length > 50)
    {
        analyze(mc, ac);
    }
    else if(sw.length > 50)
    {
        notify_sw(sw, ac);
    }
    else
    {
        alert("Please specify the target code.");
    }
}

var bToggle = document.getElementById("toggle");

bToggle.addEventListener("click", bToggleHandler);

function bToggleHandler()
{
    if(toggle_status == 1)
    {
        toggle_status = 0;
        document.getElementById("rs").style.display="none";
        document.getElementById("mc").style.display="block";
        document.getElementById("sw").style.display="block";
    }
    else
    {
        toggle_status = 1;
        document.getElementById("rs").style.display="block";
        document.getElementById("mc").style.display="none";
        document.getElementById("sw").style.display="none";
    }
    
}

var bSave = document.getElementById("save");

bSave.addEventListener("click", bSaveHandler);

function bSaveHandler()
{
    localStorage.setItem('analysis', document.getElementById("analysis_code").value);
    localStorage.setItem('sw', document.getElementById("sw_code").value);
    localStorage.setItem('main', document.getElementById("main_code").value);
    
    var http = new XMLHttpRequest();
    var url = 'save.php';
    var params = 'sw='+document.getElementById("sw_code").value+'&main='+document.getElementById("main_code").value+'&analysis='+document.getElementById("analysis_code").value+'&result='+document.getElementById("rs_area").value;
    
    http.open('POST', url, true);
    http.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    
    http.onreadystatechange = function(){
        if(http.readyState ==4 && http.status == 200) {
            alert(http.responseText);
        }
    }
    
    http.send(params);
}

var bRegister = document.getElementById("register");

bRegister.addEventListener("click", bRegisterHandler);

function bRegisterHandler()
{
    if ('serviceWorker' in navigator) {
      var params = document.getElementById("sw_params").value;
      navigator.serviceWorker.register('sw.js'+params, {scope: '/swscanner/'})
      .then(function(reg) {
        // registration worked
        console.log('Registration succeeded. Scope is ' + reg.scope);
      }).catch(function(error) {
        // registration failed
        console.log('Registration failed with ' + error);
      });
    }
}

function initialize()
{
    document.getElementById("analysis_code").value = localStorage.getItem("analysis");
    document.getElementById("sw_code").value = localStorage.getItem("sw");
    document.getElementById("main_code").value = localStorage.getItem("main");
}

function analyze(main_code, analysis_code)
{
    console.log("Analyzing: ", main_code, analysis_code);
    
    let code = main_code;
    let stage = new Iroh.Stage(code);
    
    eval(analysis_code);
    
    eval(stage.script);
}

function notify_sw(sw_code, analysis_code)
{
    //console.log("Sending MSG to SW: ", sw_code, analysis_code);
    
    send2sw({command:"analyze", swCode: sw_code, analysisCode: analysis_code});
}

function send2sw(msg)
{
    return new Promise(function(resolve, reject){
        // Create a Message Channel
        var msg_chan = new MessageChannel();

        // Handler for recieving message reply from service worker
        msg_chan.port1.onmessage = function(event){
            if(event.data.error){
                reject(event.data.error);
            }else{
                log(event.data);
                resolve(event.data);
            }
        };

        // Send message to service worker along with port for reply
        navigator.serviceWorker.controller.postMessage(msg, [msg_chan.port2]);
    });
}

function log(msg)
{
    document.getElementById("rs_area").value += msg + "\r\n";
}
