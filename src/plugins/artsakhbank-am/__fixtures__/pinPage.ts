// Страница param.php до подтверждения входа: банк просит одноразовый код
// в поле CONPASS_REQ. Номер клиента заменён на фиктивный
export const PIN_PAGE = `<form name=Pages method="post" action="param.php" enctype="multipart/form-data">
    <input type="hidden" name="csrf_token" value="3">
\t<input type="hidden" name="lang" value="2" >
    <input type="hidden" name="custid" value="100500" >
\t<input type="hidden" name="page" value="accounts" >
\t<input type="hidden" name="isdoc" value="0" >
\t<input type="hidden" name="ACTION" value="LOAD">
\t<input type="hidden" name="REASON" value=".">

<div id="paramForm" style="left:100px; width: 100%; vertical-align:central" align="center">
    <div class="w2ui-page page-0" align="center">

        <div class="navig">
          <div class="rc10">
          \t<span class="sprites navigarr"></span>
            <a href="#" class="active">AFTERLOGIN</a>
           </div>
        </div><table class="account" width="90%" border="0" cellspacing="0" cellpadding="0" style="vertical-align:top">
<tr><td class="td2"><label class="formLeftBlock">User&nbsp;&nbsp;</label>TEST USER</td></tr>
<tr><td class="th" colspan = "7">&nbsp;</td></tr>
<tr><td class="td"><label class="formLeftBlock">PIN&nbsp;&nbsp;<font color="red" size="4">*</font></label><div class="formRightBlock"><input id=CONPASS_REQ type="PASSWORD" name=CONPASS_REQ value="" maxlength=20   onchange=javaSCRIPT:SetPin() class="inputs inp1 w2field w2ui-input"></div></td></tr>
<tr></tr><tr><td colspan="2"><div class="titleBlock"><h1 class="rc5"><a onclick='javaSCRIPT:SetPin()'>Confirm&nbsp;&nbsp;</a></h1></td></tr></tr>
<tr><td class="th" colspan = "3">&nbsp;</td></tr><div class="formRightBlock"><input id=TIME type="HIDDEN" name=TIME value="00:22:54" maxlength=15    class="inputs inp1 w2field w2ui-input"></div>
    </div>
</div>
</form>`
