import PVObject from "PersistentData";
import renderBeaconBeam from "../BeaconBeam";

const pvObject = new PVObject("XLAddons", {
  zealotTimer: false,
  chWaypoints: false,
  chpowcfg: {
    x: 955,
    y: 290,
  },
});

let lastZealotSpawn = Date.now();
let chpwdersession = { started: false };

register("command", (...args) => {
  switch (args[0]) {
    case "toggle":
      switch (args[1]) {
        case "zt":
          if (args[2] != "on" && args[2] != "off")
            return ChatLib.chat(
              new Message("§7Insufficient or invalid arguments.")
            );
          pvObject.zealotTimer = args[2] == "on" ? true : false;
          break;
        case "chwp":
          if (args[2] != "on" && args[2] != "off")
            return ChatLib.chat(
              new Message("§7Insufficient or invalid arguments.")
            );
          pvObject.chWaypoints = args[2] == "on" ? true : false;
          break;
        default:
          ChatLib.chat(new Message("§7Insufficient or invalid arguments."));
      }
      break;
    case "start_powder":
      chpwdersession.started = true;
      chpwdersession.gp = 0;
      chpwdersession.mp = 0;
      chpwdersession.time = Date.now();
      ChatLib.chat(new Message("§7Started new session."));
      break;
    case "stop_powder":
      chpwdersession.started = false;
      ChatLib.chat(new Message("§7Stopped session."));
      break;
    case "config":
      switch (args[1]) {
        case "chpowcfg":
          if (args[2] == "x") {
            if (isNaN(parseInt(args[3])))
              return ChatLib.chat(new Message("§7Invalid value."));
            pvObject.chpowcfg.x = parseInt(args[3]);
            ChatLib.chat(new Message(`§7Set x to ${parseInt(args[3])}`));
          } else if (args[2] == "y") {
            if (isNaN(parseInt(args[3])))
              return ChatLib.chat(new Message("§7Invalid value."));
            pvObject.chpowcfg.y = parseInt(args[3]);
            ChatLib.chat(new Message(`§7Set y to ${parseInt(args[3])}`));
          } else {
            ChatLib.chat(new Message("§7Insufficient or invalid arguments."));
          }
          break;
        default:
          ChatLib.chat(new Message("§7Insufficient or invalid arguments."));
      }
      break;
    default:
      let response = new Message(
        "§e/xla toggle §a<module> <on/off> §e- §7Toggle a module on or off\n§e/xla start_powder §e- §7Start a powder mining session.\n§e/xla stop_powder §e- §7Stops a powder mining session.\n§6Toggles:\n   §ezt §e- §7Zealot respawn timer.\n   §echwp §e- §7Main Crystal Hollows waypoints."
      );
      ChatLib.chat(response);
  }
}).setName("xla");

register("postrenderentity", (entity) => {
  if (!entity.getName().includes("Zealot")) return;
  if (
    entity.getTicksExisted() <= 1 &&
    entity.distanceTo(Player.getX(), entity.getY(), Player.getZ()) < 50
  )
    lastZealotSpawn = Date.now();
});

register("renderOverlay", zealotOverlay);

function zealotOverlay() {
  if (!pvObject.zealotTimer) return;
  if (
    Scoreboard.getLinesByScore(6)[0] != undefined &&
    Scoreboard.getLinesByScore(6)[0].getName().includes("Dragon's") &&
    Scoreboard.getLinesByScore(9)[0].getName().includes("Dragon's")
  )
    return;
  let zealotSpawn = (lastZealotSpawn + 11000 - Date.now()) / 1000;
  if (zealotSpawn < 0) zealotSpawn = 0;
  Renderer.drawString(`Next zealot spawn in ${zealotSpawn}`, 10, 10);
}

register("renderWorld", chWaypoints);

function renderCube(x, y, z, r, g, b, a) {
  Tessellator.begin(7, false);
  Tessellator.colorize(r, g, b, a)
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
    .pos(-0.5, 0, 0.5)
    .draw();
}

// Notify user to start a session

register("chat", () => {
  if (
    Scoreboard.getLinesByScore(9)[0].getName() !=
      " §7⏣ §bPrecursor🍭§b Remnants" &&
    Scoreboard.getLinesByScore(7)[0].getName() !=
      " §7⏣ §bPrecursor🍭§b Remnants"
  )
    return;
  if (chpwdersession.started == true) return;
  ChatLib.chat(
    new Message(
      new TextComponent(
        "§7Click here to start a powder mining session."
      ).setClick("run_command", "/xla start_powder")
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
  if (chpwdersession.started == false) return;
  let multiplier = 3600000 / (Date.now() - chpwdersession.time);
  let mph = chpwdersession.mp * multiplier;
  let gph = chpwdersession.gp * multiplier;
  // Get seconds, minutes, hours session has been running
  let seconds = Math.floor((Date.now() - chpwdersession.time) / 1000);
  let minutes = Math.floor(seconds / 60);
  let hours = Math.floor(minutes / 60);
  minutes = minutes % 60;
  seconds = seconds % 60;
  let text = new Text(
    `§fUptime: ${hours} hours, ${minutes} minutes, and ${seconds} seconds.\n\n§dGemstone: §d${
      chpwdersession.gp
    }\n§dGemstone Per Hour: §d${Math.trunc(gph)}\n\n§bMithril: §b${
      chpwdersession.mp
    }\n§bMithril Per Hour: §b${Math.trunc(mph)}`,
    pvObject.chpowcfg.x,
    pvObject.chpowcfg.y
  )
    .setAlign("right")
    .setShadow(true);
  text.draw();
  // Renderer.drawString(
  //   `§7Gemstone: §d${chpwdersession.gp}\n§7Mithril: §b${chpwdersession.mp}`,
  //   pvObject.chpowcfg.x,
  //   pvObject.chpowcfg.y
  // );
}

function chWaypoints() {
  if (pvObject.chWaypoints == false) return;

  Tessellator.drawString(
    "Crystal Nucleus",
    513.5,
    107,
    513.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(513, 107, 513, 0, 255, 255, 1, true);
  renderCube(513.5, 106, 513.5, 0, 1, 1, 0.5);

  Tessellator.drawString("Jungle", 461.5, 118, 461.5, 0x00ffff, true, 0.75);
  renderBeaconBeam(461, 119, 461, 0, 255, 255, 1, true);
  renderCube(461.5, 118, 461.5, 0, 1, 1, 0.5);

  Tessellator.drawString(
    "Precursor Remnants",
    567.5,
    118,
    565.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(566, 120, 564, 0, 255, 255, 1, true);
  renderCube(566.5, 119, 564.5, 0, 1, 1, 0.5);

  Tessellator.drawString(
    "Goblin Holdout",
    462.5,
    119,
    564.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(462, 120, 564, 0, 255, 255, 1, true);
  renderCube(462.5, 119, 564.5, 0, 1, 1, 0.5);

  Tessellator.drawString(
    "Mithril Deposits",
    565.5,
    118,
    462.5,
    0x00ffff,
    true,
    0.75
  );
  renderBeaconBeam(565, 119, 462, 0, 255, 255, 1, true);
  renderCube(565.5, 118, 462.5, 0, 1, 1, 0.5);
}
