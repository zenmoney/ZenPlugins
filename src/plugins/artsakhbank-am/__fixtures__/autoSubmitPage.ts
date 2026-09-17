// Промежуточная страница online.artsakhbank.am после верного логина с паролем:
// она сама отправляет себя скриптом на main.php. Токен заменён на фиктивный
export const AUTO_SUBMIT_PAGE = `<form name="flogin" method="post" enctype="multipart/form-data" action="main.php" autocomplete="off" >
                \t<input type="hidden" name="ACTION" value="LOGIN">
                \t<input type="hidden" name="ssl_Kind" value="3">
    \t\t\t\t<input type="hidden" name="csrf_token" value="TESTCSRFTOKEN0002" maxlength="50">
\t\t\t\t\t<script language="javascript"> document.flogin.submit(); </script>';
                </form>`
