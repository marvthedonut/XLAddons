import PVObject from "PersistentData";
import renderBeaconBeam from "../BeaconBeam";
import RenderLib from "../RenderLib/index.js";

// Persistent Data

const pvObject = new PVObject("XLAddons", {
  zealotTimer: false,
  chWaypoints: false,
  chpowcfg: {
    x: 955,
    y: 300,
  },
});

// Add commas to number
// Thanks https://www.delftstack.com/howto/javascript/javascript-add-commas-to-number/

function commanum(numb) {
  var str = numb.toString().split(".");
  str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return str.join(".");
}

let lastZealotSpawn = Date.now();
let chpwdersession = { started: false };

// Main commands
register("command", (...args) => {
  switch (args[0]) {
    // Toggle modules

    case "toggle":
      switch (args[1]) {
        // Modules to toggle

        // Zealot Timer
        case "zt":
          if (args[2] != "on" && args[2] != "off")
            return ChatLib.chat(
              new Message("§7Insufficient or invalid arguments.")
            );
          pvObject.zealotTimer = args[2] == "on" ? true : false;
          break;
        // Crystal Hollows Waypoints

        case "chwp":
          if (args[2] != "on" && args[2] != "off")
            return ChatLib.chat(
              new Message("§7Insufficient or invalid arguments.")
            );
          pvObject.chWaypoints = args[2] == "on" ? true : false;
          break;
        // Arguments insufficient or invalid

        default:
          ChatLib.chat(new Message("§7Insufficient or invalid arguments."));
      }
      break;

    // Start a session

    case "start_powder":
      chpwdersession.started = true;
      chpwdersession.gp = 0;
      chpwdersession.mp = 0;
      chpwdersession.time = Date.now();
      ChatLib.chat(new Message("§7Started new session."));
      break;

    // Stop a session

    case "stop_powder":
      chpwdersession.started = false;
      ChatLib.chat(new Message("§7Stopped session."));
      break;

    // Configs

    case "config":
      switch (args[1]) {
        // Configs to change

        // Crystal hollows powder configs

        case "chpowcfg":
          // Change x

          if (args[2] == "x") {
            if (isNaN(parseInt(args[3])))
              return ChatLib.chat(new Message("§7Invalid value."));
            pvObject.chpowcfg.x = parseInt(args[3]);
            ChatLib.chat(new Message(`§7Set x to ${parseInt(args[3])}`));

            // Change y
          } else if (args[2] == "y") {
            if (isNaN(parseInt(args[3])))
              return ChatLib.chat(new Message("§7Invalid value."));
            pvObject.chpowcfg.y = parseInt(args[3]);
            ChatLib.chat(new Message(`§7Set y to ${parseInt(args[3])}`));

            // Handle invalid arguments
          } else {
            ChatLib.chat(new Message("§7Insufficient or invalid arguments."));
          }
          break;

        // Arguments insufficient or invalid

        default:
          ChatLib.chat(new Message("§7Insufficient or invalid arguments."));
      }
      break;
    default:
      // Help message

      let response = new Message(
        "§e/xla toggle §a<module> <on/off> §e- §7Toggle a module on or off\n§e/xla start_powder §e- §7Start a powder mining session.\n§e/xla stop_powder §e- §7Stops a powder mining session.\n§6Toggles:\n   §ezt §e- §7Zealot respawn timer.\n   §echwp §e- §7Main Crystal Hollows waypoints."
      );
      ChatLib.chat(response);
  }
}).setName("xla");

register("postrenderentity", (entity) => {
  // Find newly summoned zealots
  if (!entity.getName().includes("Zealot")) return;
  if (
    // Newly rendered
    entity.getTicksExisted() <= 1 &&
    // Check if the zealot was not just loaded in by new chunks

    entity.distanceTo(Player.getX(), entity.getY(), Player.getZ()) < 50
  )
    // Set zealot last spawn time
    lastZealotSpawn = Date.now();
});

register("renderOverlay", zealotOverlay);

function zealotOverlay() {
  // Check if zealot timer is on
  if (!pvObject.zealotTimer) return;

  // Check if you're in the Dragon's Nest

  if (
    Scoreboard.getLinesByScore(6)[0] != undefined &&
    !Scoreboard.getLinesByScore(6)[0].getName().includes("Dragon's") &&
    !Scoreboard.getLinesByScore(9)[0].getName().includes("Dragon's")
  )
    return;

  // Render next zealot spawn

  let zealotSpawn = (lastZealotSpawn + 11000 - Date.now()) / 1000;
  if (zealotSpawn < 0) zealotSpawn = 0;
  Renderer.drawString(`Next zealot spawn in ${zealotSpawn}`, 10, 10);
}

register("renderWorld", chWaypoints);

function renderCube(x, y, z, r, g, b, a) {
  // Code to render a cube
  Tessellator.begin(GL11.GL_QUADS, false);

  // Detect distance to player
  let am = new Entity(Player.getPlayer()).distanceTo(x, y, z) / 20;

  Tessellator.colorize(r, g, b, a * am)
    .translate(x, y, z)
    .pos(0.5, 0, 0.5)
    .pos(0.5, 0, -0.5)
    .pos(-0.5, 0, -0.5)
    .pos(-0.5, 0, 0.5)
    .pos(0.5, 1, 0.5)
    .pos(0.5, 1, -0.5)
    .pos(-0.5, 1, -0.5)
    .pos(-0.5, 1, 0.5)
    .pos(-0.5, 1, 0.5)
    .pos(-0.5, 1, -0.5)
    .pos(-0.5, 0, -0.5)
    .pos(-0.5, 0, 0.5)
    .pos(0.5, 1, 0.5)
    .pos(0.5, 1, -0.5)
    .pos(0.5, 0, -0.5)
    .pos(0.5, 0, 0.5)
    .pos(0.5, 1, -0.5)
    .pos(-0.5, 1, -0.5)
    .pos(-0.5, 0, -0.5)
    .pos(0.5, 0, -0.5)
    .pos(-0.5, 1, 0.5)
    .pos(0.5, 1, 0.5)
    .pos(0.5, 0, 0.5)
    .pos(-0.5, 0, 0.5);

  GlStateManager.func_179097_i(); // Depth disabled
  Tessellator.draw(); // Draw
  RenderLib.drawEspBox(x, y, z, 1, 1, 0, 1, 1, 0.5 * am, true); // Draw esp outline
}

// Notify user to start a session

register("chat", () => {
  // Exit out if in a session

  if (chpwdersession.started == true) return;

  ChatLib.chat(
    new Message(
      new TextComponent("§7Click here to start a powder mining session.")
        .setClick("run_command", "/xla start_powder")
        .setHoverValue("/xla start_powder")
    )
  );
}).setChatCriteria("&r&aYou uncovered a treasure chest!&r");

// Change powder amounts

register("chat", (...args) => {
  if (!chpwdersession.started) return;

  if (args[1] == "Gemstone Powder") {
    chpwdersession.gp += parseInt(args[0]);
  } else {
    chpwdersession.mp += parseInt(args[0]);
  }
}).setChatCriteria("&r&aYou received &r&b+${amt} &r&a${ptype}&r");

register("renderOverlay", renderPowder);

function renderPowder() {
  // Exit if not in a session

  if (chpwdersession.started == false) return;

  // Math to find powder per hour

  let multiplier = 3600000 / (Date.now() - chpwdersession.time);
  let mph = chpwdersession.mp * multiplier;
  let gph = chpwdersession.gp * multiplier;

  // Get seconds, minutes, hours session has been running

  let seconds = Math.floor((Date.now() - chpwdersession.time) / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  seconds = seconds % 60;

  // Render info onto screen

  let text = new Text(
    `§fUptime: ${hours} hours, ${minutes} minutes, and ${seconds} seconds.\n\n§dGemstone: §d${commanum(
      chpwdersession.gp
    )}\n§dGemstone Per Hour: §d${commanum(
      Math.trunc(gph)
    )}\n\n§bMithril: §b${commanum(
      chpwdersession.mp
    )}\n§bMithril Per Hour: §b${commanum(Math.trunc(mph))}`,
    pvObject.chpowcfg.x,
    pvObject.chpowcfg.y
  )
    .setAlign("right")
    .setShadow(true);
  text.draw();
}

function chWaypoints() {
  // Check if waypoints are on

  if (pvObject.chWaypoints == false) return;

  // Crystal Nucleus

  Tessellator.drawString(
    "Crystal Nucleus",
    513.5,
    107,
    513.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(
    513,
    107,
    513,
    0,
    255,
    255,
    1 * (new Entity(Player.getPlayer()).distanceTo(513.5, 107, 513.5) / 20),
    false
  );
  renderCube(513.5, 106, 513.5, 0, 1, 1, 0.4);

  // Jungle

  Tessellator.drawString("Jungle", 461.5, 118, 461.5, 0x00ffff, true, 0.75);
  renderBeaconBeam(
    461,
    119,
    461,
    0,
    255,
    255,
    1 * (new Entity(Player.getPlayer()).distanceTo(461.5, 118, 461.5) / 20),
    false
  );
  renderCube(461.5, 118, 461.5, 0, 1, 1, 0.4);

  // Precursor Remnants

  Tessellator.drawString(
    "Precursor Remnants",
    566.5,
    118,
    564.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(
    566,
    120,
    564,
    0,
    255,
    255,
    1 * (new Entity(Player.getPlayer()).distanceTo(567.5, 118, 565.5) / 20),
    false
  );
  renderCube(566.5, 119, 564.5, 0, 1, 1, 0.4);

  // Goblin Holdout

  Tessellator.drawString(
    "Goblin Holdout",
    462.5,
    119,
    564.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(
    462,
    120,
    564,
    0,
    255,
    255,
    1 * (new Entity(Player.getPlayer()).distanceTo(462.5, 119, 564.5) / 20),
    false
  );
  renderCube(462.5, 119, 564.5, 0, 1, 1, 0.4);

  // Mithril Deposits

  Tessellator.drawString(
    "Mithril Deposits",
    565.5,
    118,
    462.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(
    565,
    119,
    462,
    0,
    255,
    255,
    1 * (new Entity(Player.getPlayer()).distanceTo(565.5, 118, 462.5) / 20),
    false
  );
  renderCube(565.5, 118, 462.5, 0, 1, 1, 0.4);
}
