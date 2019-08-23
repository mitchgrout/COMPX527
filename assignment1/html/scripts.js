function display(evt, tabname)
{
    var idx, tabcontent, tablinks, display;
    display = document.getElementById(tabname).style.display == "block"? "none" : "block";

    // Hide all tabs
    tabcontent = document.getElementsByClassName("tabcontent");
    for (idx = 0; idx < tabcontent.length; idx++)
    {
        tabcontent[idx].style.display = "none";
    }

    // Disable all links
    tablinks = document.getElementsByClassName("tablinks");
    for (idx = 0; idx < tablinks.length; idx++) 
    {
        tablinks[idx].className = tablinks[idx].className.replace(" active", "");
    }

    // Enable/toggle the clicked link+tab
    document.getElementById(tabname).style.display = display;
    if (display === "block") evt.currentTarget.className += " active";
    else evt.currentTarget.className.replace(" active", "");
}

function attach_tree_listeners()
{
    var idx, toggler;
    toggler = document.getElementsByClassName("caret");
    for (idx = 0; idx < toggler.length; idx++) {
        toggler[idx].addEventListener("click", function() {
            this.parentElement.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("caret-down");
           });
    }
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
        if (obj.hasOwnProperty("success"))
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
    xmr.open("GET", "http://"+SERVER_NAME+"/info.php?from="+(page*25)+"&to="+((page+1)*25), true);
    xmr.send();
}

function load_coco_image(idx)
{
    var img    = document.getElementById("img_"+idx);
    var canvas = document.getElementById("draw");
    var ctx    = canvas.getContext("2d");
    var parts  = img.name.split(",");
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
        fd.append("image",  document.getElementById("file_in").files[0]);
    else if (mode == "coco")
        fd.append("url", document.getElementById("img_"+document.getElementById("selected_idx").value).src);
    else 
        return;
    fd.append("thresh", slider.value);
    results.innerHTML = "Processing...";

    xmr.onreadystatechange = function()
    {
        if (this.readyState != 4) return;
        var obj = JSON.parse(xmr.responseText);
        if (obj.hasOwnProperty("error"))
        {
            results.innerHTML = 
             '<li>'
            +' <span class="caret">Error</span>'
            +' <ul class="nested">'
            +'  <li>'
            +    'Message: ' + obj["error"]
            +'  </li>'
            +' </ul>'
            +'</li>';
        }
        else
        {
            // Handle success
            var idx, ctx, res;
            ctx = canvas.getContext("2d");
        
            res =
             '<li>'
            +' <span class="caret">Success ('+obj["success"].length+')</span>'
            +' <ul class="nested">';
            for (idx = 0; idx < obj["success"].length; idx++)
            {
                var o = obj["success"][idx],
                    label = o["label"],
                    score = o["score"].toPrecision(4),
                    x1    = Math.round(o["box"][0]),
                    y1    = Math.round(o["box"][1]),
                    x2    = Math.round(o["box"][2]),
                    y2    = Math.round(o["box"][3]);

                ctx.lineWidth   = "1";
                ctx.strokeStyle = "red";
                ctx.fillStyle   = "red";
                ctx.rect(x1, y1, x2-x1, y2-y1);
                ctx.fillRect(x1, y2, x2-x1, 15);
                ctx.stroke();

                ctx.fillStyle   = "white";
                   ctx.font        = "10px Arial";
                ctx.fillText(label + ": " + score, x1, y2+10);
                ctx.stroke();

                res +=
                 '<li>'
                +' <span class="caret">#' + (idx+1) + '</span>'
                +' <ul class="nested">'
                +'  <li>Label: ' + label + '</li>'
                +'  <li>Score: ' + score + '</li>'
                +'  <li>'    
                +'   <span class="caret">Box</span>'
                +'   <ul class="nested">'
                +'    <li>x1: ' + x1 + '</li>'
                +'    <li>y1: ' + y1 + '</li>'
                +'    <li>x2: ' + x2 + '</li>'
                +'    <li>y2: ' + y2 + '</li>'
                +'   </ul>'
                +'  </li>'
                +' </ul>'
                +'</li>';
            }
            res +=
             ' </ul>'
            +'</li>';
            results.innerHTML = res;
        }
        attach_tree_listeners();
    };
    xmr.open("POST", "http://"+SERVER_NAME+"/detect.php", true);
    xmr.send(fd);
}
