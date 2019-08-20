<html>
    <head>
        <title> COMPX527 Assignment 1 - Team 8 </title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
        /* Style the tab */
        .tab {
          overflow: hidden;
          border: 1px solid #ccc;
          background-color: #f1f1f1;
        }
        
        /* Style the buttons inside the tab */
        .tab button {
          background-color: inherit;
          float: left;
          border: none;
          outline: none;
          cursor: pointer;
          padding: 14px 16px;
          transition: 0.3s;
          font-size: 17px;
        }
        
        /* Change background color of buttons on hover */
        .tab button:hover {
          background-color: #ddd;
        }
        
        /* Create an active/current tablink class */
        .tab button.active {
          background-color: #ccc;
        }
        
        /* Style the tab content */
        .tabcontent {
          display: none;
          padding: 6px 12px;
          border: 1px solid #ccc;
          border-top: none;
        }
        </style>

        <script>
        <!-- Derived from https://www.w3schools.com/howto/howto_js_tabs.asp -->
        function display(evt, tabname)
        {
            var i, tabcontent, tablinks;
              tabcontent = document.getElementsByClassName("tabcontent");
              for (i = 0; i < tabcontent.length; i++)
            {
                  tabcontent[i].style.display = "none";
              }
              tablinks = document.getElementsByClassName("tablinks");
              for (i = 0; i < tablinks.length; i++) 
            {
                  tablinks[i].className = tablinks[i].className.replace(" active", "");
              }
              document.getElementById(tabname).style.display = "block";
              evt.currentTarget.className += " active";
        }

        function get_info(offset)
        {
            var xmr       = new XMLHttpRequest();
			var left      = document.getElementById("button_left");
			var right     = document.getElementById("button_right");
            var sc_page   = document.getElementById("show_current_page");
			var c_page    = document.getElementById("current_page");
            var page      = +c_page.value;
			page          = Math.max(0, page+offset);
			c_page.value  = ""+page;
			sc_page.innerHTML = "Page "+c_page.value;
			left.disabled = page == 0;

			var idx;
            for (idx = 0; idx < 25; idx++)
            {
                document.getElementById("img_"+idx).name = "";
                document.getElementById("img_"+idx).src  = "";
            }
 
            xmr.onreadystatechange = function()
            {
                if (this.readyState != 4) return;
                var obj = JSON.parse(xmr.responseText);
                if (this.status == 200)
                {
                    for (idx = 0; idx < 25; idx++)
                    {
						var o  = obj["success"][idx];
						var i  = document.getElementById("img_"+idx);
						i.name = o["file_name"]+","+o["width"]+","+o["height"];
						i.src  = o["coco_url"];
                    }
                }
                else { }
            }
            xmr.open("GET", "http://<?php echo $_SERVER['SERVER_NAME']; ?>/info.php?from="+(page*25)+"&to="+((page+1)*25), true);
			xmr.send();
        }

		function load_coco_image(idx)
		{
			var img    = document.getElementById("img_"+idx);
        	var canvas = document.getElementById("draw");
        	var ctx    = canvas.getContext("2d");
			var parts  = img.name.split(',');
			canvas.width  = +parts[1];
			canvas.height = +parts[2];
        	ctx.drawImage(img, 0, 0);

			document.getElementById("image_mode").value = "coco";
			document.getElementById("selected_idx").value = ""+idx;
		}

        function load_local_image()
        {
			var canvas = document.getElementById("draw");
			var url    = URL.createObjectURL(document.getElementById("file_in").files[0]);
			var img    = new Image();
			var ctx    = canvas.getContext("2d");
	
			img.onload = function()
			{
				canvas.width = img.width;
				canvas.height= img.height;
				ctx.drawImage(img, 0, 0);
			};
			img.src = url;
   
			document.getElementById("image_mode").value = "upload";
     }

        function detect()
        {
            var xmr     = new XMLHttpRequest();
            var fd      = new FormData();
            var canvas  = document.getElementById("draw");
            var slider  = document.getElementById("thresh");
            var results = document.getElementById("results");
			var mode    = document.getElementById("image_mode").value;

			if (mode == "upload")
			{
            	fd.append('image',  document.getElementById("file_in").files[0]);
			}
			else if (mode == "coco")
			{
				fd.append('url', document.getElementById("img_"+document.getElementById("selected_idx").value).src);
			}
			else { return; }

			fd.append('thresh', slider.value);
            xmr.onreadystatechange = function()
            {
                if (this.readyState != 4) return;
				alert(xmr.responseText);
                results.innerHTML = xmr.responseText;
                var obj = JSON.parse(xmr.responseText);
                if (this.status == 200)
                {
                    // Handle success
					var ctx = canvas.getContext("2d");
					var idx;
					for (idx = 0; idx < obj['success'].length; idx++)
					{
						var o = obj['success'][idx];
						ctx.lineWidth="1";
						ctx.strokeStyle="red";
						var x1=o['box'][0];
						var y1=o['box'][1];
						var x2=o['box'][2];
						var y2=o['box'][3];

						ctx.rect(x1, y1, x1+x2, y1+y2);// + (x2-x1)/2, y1+(y2-y1)/2, x2 + (x2-x1)/2, y2);
						ctx.stroke();
					}
                }
                else { }
            };
            xmr.open("POST", "http://<?php echo $_SERVER['SERVER_NAME']; ?>/detect.php", true);
            xmr.send(fd);
        }
        </script>
    </head>


    <body>
        <center>
            <div>
                <canvas id="draw" width="400" height="600" style="box-shadow: 0 0 2px 1px rgba(0, 140, 186, 0.5);"></canvas> <br/>
                <textarea id="results"></textarea> <br/>
                <input type="hidden" id="image_mode" value="upload"/>
                <input type="range"  id="thresh" min="0" max="1" step="0.01" value="0.5" /> <br/>
                <input type="submit" onclick="detect()" /> <br/>
            </div>
        
            <div class="tab" style="width:60%">
                <button class="tablinks" onclick="display(event, 'upload')"> Upload </button>
                <button class="tablinks" onclick="display(event, 'coco')"> MS-COCO </button>
            </div>
    
            <div id="upload" class="tabcontent">
                <input type='file' id='file_in' accept="image/*" onchange='load_local_image()' /> 
            </div>
    
            <div id="coco" class="tabcontent">
                <input type="hidden" id="current_page" val="0" />
                <button type="button" id="button_left"  onclick='get_info(-1)'>Left</button>
				<span id="show_current_page"></span>
                <button type="button" id="button_right" onclick='get_info(+1)'>Right</button>
				<input type="hidden" id="selected_idx" val="0" />

                <table style='width=100%'>
                    <?php
                    echo "<tr>";
                    for ($idx = 0; $idx < 25; $idx++)
                    {
                        if ($idx != 0 && $idx % 5 == 0) echo "</tr><tr>";
                        echo '<td><img id="img_'.$idx.'" width="150" height="150" onclick="load_coco_image('.$idx.')" /img></td>';
                    }
                    echo "</tr>";
                    ?>
                </table>
                <script> get_info(0); </script>
            </div>
        </center>
    </body>
</html>
