// Форма Pages с главной страницы online.artsakhbank.am после входа.
// Номер клиента заменён на фиктивный
export const MAIN_PAGE = `<form name=Pages id=Pages method="post" action="main.php" enctype="multipart/form-data">
    <input type="hidden" name="csrf_token" value="3" maxlength="50">
    <input type="hidden" name="ssl_Kind" value="" maxlength="4">
\t<input type="hidden" name="lang" value="2" >
    <input type="hidden" name="custid" value="100500" >
\t<input type="hidden" name="page" value="accounts" >
\t<input type="hidden" name="isdoc" value="0" >
\t<input type="hidden" name="ACTION" value="LOAD">
\t<input type="hidden" name="REASON" value=".">
</form>`
