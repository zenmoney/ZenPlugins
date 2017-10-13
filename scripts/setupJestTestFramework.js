console.debug = process.env.DEBUG ? function() {
    console.log("[console.debug]", ...arguments);
} : function() {
};
