<html>
    <head>
        <title> COMPX527 Assignment 1 - Team 8 </title>
        <link rel="stylesheet" href="style.css">
        <script> const SERVER_NAME = "<?php echo $_SERVER['SERVER_NAME']; ?>"; </script>
        <script src="./scripts.js"> </script>
    </head>

    <body>
        <center>
            <table border="1">
                <tr>
                    <th colspan="2" align="center">
                        <h2> COMPX527 Assignment 1 - Team 8 - Image Detection </h2>
                    </th>
                </tr>

                <tr>
                    <td width="75%" align="center"> 
                        <canvas id="draw" width="200" height="200"></canvas> 
                    </td>
                
                    <td width="25%" align="left">
                        <ul class="tree" id="results">
                            Waiting...
                            <!-- Yielded results will go here -->
                        </ul>
                    </td>    
                </tr>

                <tr>
                    <td colspan="2" align="center">
                        <input type="hidden" id="image_mode" value="upload"/>

                        Threshold: <span id="thresh_val">0.5</span><br/>
                        <input type="range"  id="thresh" min="0" max="1" step="0.01" value="0.5" oninput="document.getElementById('thresh_val').innerHTML=this.value" /> <br/>
                        <button type="button" onclick="detect()">Analyse</button> <br/>
                    </td>
                </tr>
            </table>
            <br/>
            <div style="width:50%">
                <div class="tab">
                    <button style="width:33%" class="tablinks" onclick="display(event, 'upload')"> Upload </button>
                    <button style="width:34%" class="tablinks" onclick="display(event, 'direct_url')"> URL </button>
                    <button style="width:33%" class="tablinks" onclick="display(event, 'coco')"> MS-COCO </button>
                </div>
        
                <div id="upload" class="tabcontent">
                    <input type="file" id="file_in" accept="image/*" onchange="load_local_image()" /> 
                </div>

                <div id="direct_url" class="tabcontent">
                    <input type="text" id="url_in">
                    <button onclick="load_direct_url()">Fetch</button>
                </div>

                <div id="coco" class="tabcontent">
                    <input type="hidden" id="current_page" val="0" />
                    <button type="button" id="button_left"  onclick="get_info(-1)">Prev</button>
                    <span id="show_current_page"></span>
                    <button type="button" id="button_right" onclick="get_info(+1)">Next</button>
                    <input type="hidden" id="selected_idx" val="0" />
    
                    <table>
                        <?php
                        echo '<tr>';
                        for ($idx = 0; $idx < 25; $idx++)
                        {
                            if ($idx != 0 && $idx % 5 == 0) echo "</tr><tr>";
                            echo '<td><img id="img_'.$idx.'" width="150" height="150" onclick="load_coco_image('.$idx.')" /img></td>';
                        }
                        echo "</tr>";
                        ?>
                    </table>
                    <script>
                        get_info(0); 
                        document.getElementById("thresh_val").innerHTML=document.getElementById("thresh").value;
                    </script>
                </div>
            </div>
        </center>
    </body>
</html>
