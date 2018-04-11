import {handleMessageFromWindow} from "./handleMessageFromWindow";

global.addEventListener("message", (event) => handleMessageFromWindow({event}));
