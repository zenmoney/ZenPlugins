# ZenmoneyManifest.xml

[Example file](../src/plugins/example/ZenmoneyManifest.xml)
```xml
<?xml version="1.0" encoding="utf-8"?>
<provider>
    <id>example</id> <!--plugin name, same as directory name-->
    <company>0</company> <!-- internal zenmoney id, left it 0, during the merge we will fix to real one -->
    <description> <!--some additional info about bank synchronization-->
        Synchronization plugin example.
        Input your login and password from the bank.
    </description>
    <version>1.0</version> <!--legacy, don't change-->
    <build>1</build> <!--legacy, don't change-->
    <modular>true</modular> <!--legacy, don't change-->
    <files> <!--legacy, don't change-->
        <js>index.js</js>
        <preferences>preferences.xml</preferences>
    </files>
    <codeRequired>false</codeRequired> <!--optional (default true),
    true means that plugin needs some interaction with user
    during every synchronization (eg. get code from sms)
    Setting it to false gives ability to set up automatic synchronization in background-->
</provider>
```
