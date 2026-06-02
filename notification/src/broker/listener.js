import { subscribeToQueue } from "./rabbit.js";
import { userCreatedHandler } from "../handlers/userCreated.js";

function startListener() {
  subscribeToQueue("user_created", userCreatedHandler);
}

export default startListener;
