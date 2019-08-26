// Boilerplate from our derived components
function display(evt, tabname)
{
    var tabcontent = document.getElementsByClassName("tabcontent"),
        tablinks   = document.getElementsByClassName("tablinks"),
        display    = $(tabname).style.display == "block"? "none" : "block";

    // Hide all tabs
    for (var idx = 0; idx < tabcontent.length; idx++)
        tabcontent[idx].style.display = "none";

    // Disable all links
    for (var idx = 0; idx < tablinks.length; idx++)
        tablinks[idx].className = tablinks[idx].className.replace(" active", "");

    // Enable/toggle the clicked link+tab
    $(tabname).style.display = display;
    if (display == "block")
        evt.currentTarget.className += " active";
    else
        evt.currentTarget.className.replace(" active", "");
}

function attach_tree_listeners()
{
    var toggler = document.getElementsByClassName("caret");
    for (var idx = 0; idx < toggler.length; idx++)
        toggler[idx].onclick = function()
        {
            this.parentElement.querySelector(".nested").classList.toggle("active");
            this.classList.toggle("caret-down");
        };
}

////////////////////////////////////////////////////////////////////////////////

// Consts
const DEFAULT_IMAGE_MODE   = "none";
const DEFAULT_IMAGE_TARGET = "none";
const DEFAULT_IMAGE_WIDTH  = 0;
const DEFAULT_IMAGE_HEIGHT = 0;
const DEFAULT_COCO_PAGE    = 0;
const DEFAULT_RESULTS      = "Response: none";
const DEFAULT_THRESHOLD    = 0.5;
const NUM_COCO_IMAGES      = 25;

// Useful temporaries
var image_mode;   // How the target was selected
var image_target; // A human-readable target name
var image_width;  // Target width
var image_height; // Target height
var coco_page;    // The MS-COCO page we're looking at

// undefined-init temporaries
var direct_file;  // A File object [for upload]
var direct_url;   // A URL to a remote source
var coco_url;     // An MS-COCO URL
var image;        // A copy of the image prior to drawing
var ratio;        // The downscale-ratio of our image

// Convenience functions
function $(s)
{ return document.getElementById(s); }

function set_image_mode(v)
{ return $("image_mode").innerHTML = image_mode = v; }

function set_image_target(v)
{ return $("image_target").innerHTML = image_target = v; }

function set_image_width(v)
{ return $("image_width").innerHTML = image_width = v; }

function set_image_height(v)
{ return $("image_height").innerHTML = image_height = v; }

function set_coco_page(v)
{ return $("current_page").innerHTML = coco_page = v; }

function set_thresh(v)
{ return $("thresh").value = $("show_thresh").innerHTML = v; }

// Reset all values on the page
function reset()
{
    // Set up the tree-view
    attach_tree_listeners();
    // and the associated variables
    set_image_mode(DEFAULT_IMAGE_MODE);
    set_image_target(DEFAULT_IMAGE_TARGET);
    set_image_width(DEFAULT_IMAGE_WIDTH);
    set_image_height(DEFAULT_IMAGE_HEIGHT);
    $("results").innerHTML = DEFAULT_RESULTS;
    direct_file = undefined;
    direct_url  = undefined;
    coco_url    = undefined;
    image       = undefined;
    ratio       = undefined;

    // Load the placeholder image
    var img    = new Image();
    img.onload = function()
    {
        $("draw").width  = img.width;
        $("draw").height = img.height;
        $("draw").getContext("2d").drawImage(img, 0, 0);
    }
    img.src = "./placeholder.png";

    // Reset all tab content
    set_thresh(DEFAULT_THRESHOLD);
    $("file_in").value = "";
    $("url_in").value  = "";
    set_coco_page(DEFAULT_COCO_PAGE);
    get_info(0);
}

// Update the MS-COCO tab
function get_info(page_offset)
{
    // Start by updating the current page number
    set_coco_page(Math.max(0, coco_page + page_offset));
    $("button_left").disabled = coco_page == 0;

    // Blank out all of the image tiles
    for (var idx = 0; idx < NUM_COCO_IMAGES; idx++)
        $("img_"+idx).name = $("img_"+idx).src = "";

    // Fetch the next NUM_COCO_IMAGES images
    var xmr = new XMLHttpRequest();
    xmr.onreadystatechange = function()
    {
        if (this.readyState != 4) return;

        // Response should always be valid JSON
        var obj = JSON.parse(xmr.responseText);
        if (obj.hasOwnProperty("success"))
        {
            // We should have received NUM_COCO_IMAGES values
            // We'll be careful and clamp the response
            for (var idx = 0; idx < Math.min(NUM_COCO_IMAGES, obj["success"].length); idx++)
            {
                // Update the idx'th image tile
                // Hide some useful metadata in .name
                var o  = obj["success"][idx];
                var i  = $("img_"+idx);
                i.name = o["file_name"]+","+o["width"]+","+o["height"];
                i.src  = o["coco_url"];
            }
        }
        else
        {
            // Error only occurs if the specified to/from values are invalid
            document.log("An error occured while fetching COCO images: ");
            document.log(obj);
        }
    }
    var from =  coco_page    * NUM_COCO_IMAGES,
        to   = (coco_page+1) * NUM_COCO_IMAGES;
    xmr.open("GET", "http://"+SERVER_NAME+"/info.php?from="+from+"&to="+to, true);
    xmr.send();
}

// Helper for the load_* functions
function set_image_info(img, mode, target)
{
    // Figure out the rescaling
    const H = screen.height / 2,
          W = screen.width  / 3;
    ratio = Math.min(H / img.height, W / img.width);
    image = img;

    // Update the necessary variables + HTML elements
    set_image_mode(mode);
    set_image_target(target);
    set_image_width(img.width);
    set_image_height(img.height);
    $("draw").width  = img.width  * ratio;
    $("draw").height = img.height * ratio;
    $("draw").getContext("2d").drawImage(img, 0, 0, $("draw").width, $("draw").height);
    $("results").innerHTML = DEFAULT_RESULTS;
}

// Load direct from local file
function load_local_image()
{
    // Load the file from the client, then store learnt info
    var canvas = $("draw"),
        file   = $("file_in").files[0],
        url    = URL.createObjectURL(file),
        img    = new Image();
    $("results").innerHTML = DEFAULT_RESULTS;
    img.onload = function()
    {
        set_image_info(img, "upload", file.name);
        direct_file = file;
    };
    img.src = url;
}

// Load direct from URL
function load_direct_url()
{
    // Fetch the remote image, then store learnt info
    var url    = $("url_in").value,
        canvas = $("draw"),
        img    = new Image();
    $("results").innerHTML = DEFAULT_RESULTS;
    img.onload = function()
    {
        set_image_info(img, "url", url);
        direct_url = url;
    };
    img.src = url;
}

// Load a clicked COCO image
function load_coco_image(idx)
{
    // All we need to do is copy the clicked tile info across
    // However, we can't directly use that image due to
    // the element being reused across pages
    var img    = new Image(), // $("img_"+idx),
        parts  = $("img_"+idx).name.split(","),
        canvas = $("draw");
    // NOTE: Doing it this way is unnecessary but is the same code as before
    img.onload = function()
    {
        set_image_info(img, "coco", img.src);
        coco_url = img.src;
    }
    img.src = $("img_"+idx).src;
}

// Send the selected file off to the backend and output results
function detect()
{
    // Set up our POST arguments
    var fd = new FormData();
    fd.append("thresh", $("thresh").value);
    switch (image_mode)
    {
        case "upload": fd.append("image", direct_file); break;
        case "url":    fd.append("url",   direct_url);  break;
        case "coco":   fd.append("url",   coco_url);    break;
        default: return;
    }

    var xmr     = new XMLHttpRequest();
    var ctx     = $("draw").getContext("2d");
    var results = $("results");
    xmr.onreadystatechange = function()
    {
        if (this.readyState != 4) return;

        // Response should always be valid JSON
        var obj = JSON.parse(xmr.responseText);

        // Redraw the image [covers the case when we are re-analysing]
        ctx.drawImage(image, 0, 0, image.width*ratio, image.height*ratio);
        if (obj.hasOwnProperty("error"))
        {
            // On failure, set response to error message
            results.innerHTML =
             '<span class="caret">Response: error</span>'
            +'<ul class="nested">'
            +' <li>'
            +   'Message: ' + obj["error"]
            +' </li>'
            +'</ul>';
        }
        else
        {
            // On success, render the results
            var res =
             '<span class="caret">Response: success ('+obj["success"].length+' detections)</span>'
            +'<ul class="nested">';
            ctx.beginPath();
            ctx.scale(ratio, ratio);
            for (var idx = 0; idx < obj["success"].length; idx++)
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
                ctx.fillRect(x1, y2, x2-x1, 20);
                ctx.stroke();

                ctx.fillStyle   = "white";
                ctx.font        = "15px Arial";
                ctx.fillText(label + ": " + score, x1, y2+12);
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
            // Annoyingly we have to undo the scale
            ctx.scale(1/ratio, 1/ratio);
            res += '</ul>';
            results.innerHTML = res;
        }
        attach_tree_listeners();
        $("thresh").disabled = $("reset").disabled = $("detect").disabled = false;
    };
    $("thresh").disabled = $("reset").disabled = $("detect").disabled = true;
    xmr.open("POST", "http://"+SERVER_NAME+"/detect.php", true);
    xmr.send(fd);
}
