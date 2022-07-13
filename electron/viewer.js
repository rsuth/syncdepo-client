const buildViewer = (depo) => {
    return `<!DOCTYPE html>
    <html lang="en">
    
    <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="initial-scale=1.0">
        <title>SyncDepo viewer</title>
        <style>
            body {
                margin: 0;
                height: 100vh;
                font-family: Arial, Helvetica, sans-serif;
                background-color: #22223b;
            }
    
            li {
                list-style-type: none;
            }
            p {
                margin: 5px;
            }
    
            .container {
                height: 100%;
                display: grid;
                grid-template-rows: 60px 1fr 30px;
                grid-template-columns: 1fr 8fr 10fr 1fr;
                grid-template-areas:
                    '. header header .'
                    '. left right .'
                    '. footer footer .';
            }
    
            header {
                grid-area: header;
                justify-self: center;
            }
    
            footer {
                grid-area: footer;
                justify-self: end;
            }
    
            .lside {
                justify-self: end;
                grid-area: left;
    
            }
    
            #info-container {
                background-color: #fffbff;
                border-radius: 5px;
                margin-top: 10px;
                box-shadow: 0 1px 4px 0 rgb(0 0 0 / 10%), 0 2px 20px 0 rgb(0 0 0 / 5%);
                padding: 5px;
            }
    
            .rside {
                width: 100%;
                height: calc(100vh - 70px);
                justify-self: start;
                grid-area: right;
                margin-left: 10px;
            }
    
            .transcript-line {
                height: 1.1em;
                font-size: 1.1em;
                line-height: 1.1em;
                font-family: 'Courier New', Courier, monospace;
                overflow-x: hidden;
                white-space: pre;
            }
            .transcript-line:hover {
                cursor: pointer;
            }
    
            .transcript-container {
                width: 100%;
                height: 100%;
                background-color:#fffbff;;
                border: 1px solid rgb(255, 255, 255);
                border-radius: 5px;
                box-shadow: 0 1px 4px 0 rgb(0 0 0 / 10%), 0 2px 20px 0 rgb(0 0 0 / 5%);
            }

            #transcript-lines-list {
                height: 100%;
                overflow-y: scroll;
                margin: 0;
            }

    
            video {
                margin-top: 10px;
                width: 100%;
                max-width: 480px;
            }
            .active {
                background-color: rgb(250, 250, 119);
            }
            ul {
                padding-left: 10px;
            }
            h2 {
                font-size: 1.8em;
                line-height: 1.8em;
                margin-top: 5px;
                color: #fffbff;
            }
            h4 {
                font-size: 1.4em;
                margin: 5px;
            }
        </style>
    </head>
    
    <body>
        <div class="container">
            <header>
                <h2>SyncDepo <span style="font-size:.8em;">Viewer</span></h2>
            </header>
            <div></div>
            <div class="lside">
                <div class="video-container">
                    <video id="video-player" controls></video>
                </div>
                <div id="info-container">
                </div>
            </div>
            <div class="rside">
                <div class="transcript-container">
                    <ul id="transcript-lines-list">
                    </ul>
                </div>
            </div>
            <div>
    
            </div>
            <footer></footer>
        </div>
        <script>
            const depo = ${JSON.stringify(depo)}
            
            var currentLineIndex = 0;
            
            // create array of just start times to call findIndex on
            var startTimes = depo.lines.map((line) => line.start);
            const vidEl = document.getElementById('video-player');
            const linesUl = document.getElementById('transcript-lines-list');
            const infoEl = document.getElementById('info-container');
            
            let nameEl = document.createElement('h4');
            nameEl.textContent = "Witness: " + depo.name;
            infoEl.appendChild(nameEl);
    
            let dateEl = document.createElement('p');
            dateEl.textContent = "Date Taken: " + depo.date;
            infoEl.appendChild(dateEl);
    
            let rtEl = document.createElement('p');
            rtEl.textContent = "Running Time: " + depo.RT;
            infoEl.appendChild(rtEl);

            vidEl.setAttribute('src', depo.mediaPath);
    
            for(let i = 0; i < depo.lines.length; i++){
                let el = document.createElement('li');
                el.classList.add('transcript-line')
                
                let txt = "";
                
                if(depo.lines[i].line_number === 1){
                    txt = depo.lines[i].page_number.toString().padStart(3, "0") + ":" + depo.lines[i].text.trim();
                } else {
                    txt = "    " + depo.lines[i].text.trim();
                }
                
                el.textContent = txt;
                el.addEventListener('click', (event)=>{
                    vidEl.currentTime = depo.lines[i].start+.01;
                })
                if (i === 0){
                    el.classList.add('active');
                }
                linesUl.appendChild(el);
            }
    
            vidEl.addEventListener('timeupdate', (event) => {
                let t = vidEl.currentTime;
                if (t > 0) {
                    // find the first start time that is greater than the seek to time.
                    // then we know that the time is within the line before that line.
                    let index =
                        startTimes.findIndex((time) => {
                            return time >= t;
                        }) - 1;
                    if (index < 0) {
                        currentLineIndex = (depo.lines.length - 1);
                    } else {
                        currentLineIndex = (index);
                    }
                } else {
                    // we seeked to 0.
                    currentLineIndex = 0;
                }
                document.getElementsByClassName('active')[0].classList.remove('active');
                [...linesUl.children][currentLineIndex].classList.add('active');
            })
        </script>
    </body>
    
    </html>`;
  }

  exports.buildViewer = buildViewer;