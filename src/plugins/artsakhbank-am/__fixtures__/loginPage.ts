// Фрагмент настоящей страницы online.artsakhbank.am/login.php (lang=2, английский).
// Токен заменён на фиктивный, всё остальное — как отдаёт банк
export const LOGIN_PAGE = `<form name="flogin" method="post" enctype="multipart/form-data" action="login.php">
                <!--  ==============  -->
                <input type="hidden" name="ACTION" value="PGLOGIN">
    \t\t\t<input type="hidden" name="csrf_token" value="TESTCSRFTOKEN0001" maxlength="50">
                <input type="hidden" name="lang" value=2 maxlength="1" >
                <!--  ==============  -->
              <label>Login</label>
              <input type="text" id="login" name="login" class="inputs inp1 w2field w2ui-input keyboardInput"
              \t\t_scrolltop="0" maxlength="20" onKeyDown="return OnKeyDown(event, this)" />
              <div class="space10"></div>

              <label>Password</label>
              <input type="password" id="password" name="password" class="inputs inp1 w2field w2ui-input keyboardInput"
              \t\t_scrolltop="0" maxlength="20" autocomplete="off" onKeyDown="return OnKeyDown(event, this)"/>
              <div class="space10"></div>

              <!-- disabled by mgd
              <div class="space5"></div>
              <label>Security</label>
              <select id="secur_kind" name="secur_kind" class="inputs inp1 w2field w2ui-input" style="padding:4px; float:right">
                  <option id="1" value="1">Key file </option>
                  <option id="3" value="3">SMS </option>
                  <option id="5" value="5">eMail </option>
              </select>
              <div class="space5"></div>
              -->

              <!-- added by mgd -->
              <label>Security</label>
              <div class="center-on-page">
                  <input type="radio" name="mysecure_kind" id="rb1" value="1" onclick="myFunction()"  />
                  <label class="mylabel" style="width:52px;" for="rb1">Key file</label>
                  <input type="radio" name="mysecure_kind" id="rb2" value="3" onclick="myFunction()" checked />
                  <label class="mylabel" style="width:38px;" for="rb2">SMS</label>
                  <input type="radio" name="mysecure_kind" id="rb3" value="5" onclick="myFunction()"  />
                  <label class="mylabel" style="width:42px;" for="rb3">eMail</label>
              </div>

              <!--  phakel bankum /key  file_input_div-->
              <div id="banaliDiv" style="display: none;">
                  <div class="space1"></div>
                  <!--  <label>Key</label>-->
                  <div class="rel">
                      <input type="text" id="fileName" class="inputs inp1 w2field w2ui-input" placeholder="Select a file ----->" style="font-family:Verdana,Tahoma,Geneva,sans-serif;" readonly>
                      <div class="file_input_div">
                          <input id="fileInputButton" type="button" value="" class="sprites file_input_button" />
                          <input type="file" name="userfile" class="file_input_hidden"
                                 onChange="javascript: document.getElementById('fileName').value = this.value" />
                      </div>
                  </div>
              </div>
              <!-- minchev stex /key  file_input_div -->
              <div class="space20"></div>

              <hr id="noBanaliHR" class="myHR" style="margin-bottom: 10px; display: block;">
              <table width="100%" border="0" style="margin:0; padding:0;">
              <tr>
                <td width="28%" style="margin: 0; padding: 0;">
                    <a href="#" onClick="javascript:langchange(1)" id="LNGA"><img id = nav3 alt='Armenian' src='css/images/lng/am.jpg' height='14' border='0' style="padding-top:15px;"></a>
                    <a href="#" onClick="javascript:langchange(2)" id="LNGE"><img id = nav3 alt='English'  src='css/images/lng/USD.png' height='14' border='0'></a>
                    <a href="#" onClick="javascript:langchange(3)" id="LNGR"><img id = nav3 alt='Russian'  src='css/images/lng/RUR.jpg' height='14' border='0'></a>
                </td><td width="42%" style="margin: 0; padding: 0; text-align: center; vertical-align: bottom;">
                    <a href="#" onClick="javascript:forgp()">Forgot password ?</a>
                </td><td style="margin:0; padding:0;">
                    <input type="submit" value=" Login " class="buttons subbtn" onClick ="return setform();" style=" color:#039; background-color:#fff; border: 1px solid #ccc; border-radius:6px;" />&nbsp;&nbsp;
                </td>
              </tr>
              </table>
            </form>`
