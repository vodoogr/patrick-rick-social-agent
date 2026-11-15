import { test } from "node:test";
import assert from "node:assert/strict";
import { createVideoBrief } from "../services/videoBrief";

test("brief keeps the supplied version and does not claim external actions", () => {
  const brief = createVideoBrief({
    song: "Golden Dust", version: "Electro-Version (Remastered)",
    artist: "Patrick Rick", location: "Granada, España",
    concept: "Paseo de los Tristes y Alhambra iluminada",
    wardrobe: "Camisa azul y pantalón beige", visualStyle: "Azul y amarillo dorado",
  });
  assert.equal(brief.version, "Electro-Version (Remastered)");
  assert.equal(brief.location, "Granada, España");
  assert.equal(brief.saved, false);
  assert.equal(brief.generated, false);
  assert.equal(brief.scheduled, false);
  assert.equal(brief.published, false);
  assert.equal(brief.safeguards.requireApprovalBeforePublishing, true);
});

