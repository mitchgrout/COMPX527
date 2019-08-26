<html>
  <head>
    <title>COMPX527 Assignment 1 - Team 8</title>
    <link rel="stylesheet" href="style.css">
    <script> const SERVER_NAME = "<?php echo $_SERVER['SERVER_NAME']; ?>"; </script>
    <script src="./scripts.min.js"> </script>
  </head>

  <body>
    <center>
      <table border="1" width="50%">
        <tr>
          <!-- Title element -->
          <th colspan="2" align="center">
            <h2>COMPX527 Assignment 1 - Team 8 - Image Detection</h2>
          </th>
        </tr>

        <tr>
          <!-- For drawing the image -->
          <td rowspan="2" width="75%" align="center"> 
            <canvas id="draw"></canvas> 
          </td>

          <!-- Tree-list for results + image info --> 
          <td width="25%" align="left">
            <ul class="tree">
              <li>
                <span class="caret">Image Details</span>
                <ul class="nested">
                  <li>
                    Mode: <span id="image_mode"></span>
                  </li>

                  <li>
                    Target: <span id="image_target"></span>
                  </li>
                  <li>
                    Dimensions: 
                        (<span id="image_width" ></span>,
                         <span id="image_height"></span>) 
                  </li>
                </ul>
              </li>

              <li id="results">
              </li>
            </ul>
          </td>  
        </tr>

        <!-- Image submission + threshold selection -->
        <tr>
          <td align="center" style="height:25%">
            Threshold: <span id="show_thresh"></span><br/>
            <input type="range"  id="thresh" min="0" max="1" step="0.01" oninput="set_thresh(this.value)" /> <br/>
            <button type="button" id="reset" onclick="reset()">Reset</button>
            <button type="button" id="detect" onclick="detect()">Analyse</button> 
          </td>
        </tr>
      </table>
      <br/>

      <div style="width:50%">
        <!-- Tab list for selecting inputs -->
        <div class="tab">
          <button style="width:33%" class="tablinks" onclick="display(event, 'upload')"> Upload </button>
          <button style="width:34%" class="tablinks" onclick="display(event, 'direct_url')"> URL </button>
          <button style="width:33%" class="tablinks" onclick="display(event, 'coco')"> MS-COCO </button>
        </div>
    
        <!-- Tab page for uploading local files -->
        <div id="upload" class="tabcontent">
          <input type="file" id="file_in" accept="image/*" onchange="load_local_image()" />
        </div>

        <!-- Tab page for providing a direct URL -->
        <div id="direct_url" class="tabcontent">
          <input type="text" id="url_in" style="width:33%">
          <button onclick="load_direct_url()">Fetch</button>
        </div>

        <!-- Tag page for selecting a list of COCO images -->
        <div id="coco" class="tabcontent">
          <button type="button" id="button_left"  onclick="get_info(-1)">Prev</button>
          Page: <span id="current_page"></span>
          <button type="button" id="button_right" onclick="get_info(+1)">Next</button>
  
          <table>
            <?php
            echo '<tr>';
            for ($idx = 0; $idx < 25; $idx++)
            {
              if ($idx != 0 && $idx % 5 == 0) echo "</tr><tr>";
              echo '<td><img id="img_'.$idx.'" width="150" height="150" onclick="load_coco_image('.$idx.')"/></td>';
            }
            echo "</tr>";
            ?>
          </table>
         </div>
      </div>

      <!-- One-off initialization -->
      <script> reset(); </script>
    </center>
  </body>
</html>
