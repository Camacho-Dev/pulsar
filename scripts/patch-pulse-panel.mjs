import fs from "fs";

const p = "src/components/pulsar/pulse-panel.tsx";
let s = fs.readFileSync(p, "utf8");

s = s.replace(
  "El pulso aun no tiene un destino para ti",
  "Sin automaticas activas ahora"
);
s = s.replace(
  `Cuando repitas rutas, apareceran aqui como sugerencias anticipadas.
          Abre Plan B abajo si necesitas ir a otro sitio ahora.`,
  `Programa viajes en Configuracion (dia, hora y destino). Solo aparecen
          aqui dentro de esa franja. O usa Plan B para ir ya.`
);

if (!s.includes("/pulse/settings")) {
  s = s.replace(
    `        </p>
      </div>
    );
  }

  return (
    <motionlessDiv className="space-y-4">`,
    `        </p>
        <Link
          href="/pulse/settings"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 py-2.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
        >
          <Settings className="h-4 w-4" />
          Configuracion y automaticas
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">`
  );
  s = s.replace(
    `        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">`,
    `        </p>
        <Link
          href="/pulse/settings"
          className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-violet-500/40 bg-violet-500/10 py-2.5 text-xs font-medium text-violet-200 hover:bg-violet-500/20"
        >
          <Settings className="h-4 w-4" />
          Configuracion y automaticas
        </Link>
      </div>
    );
  }

  return (
    <motionlessDiv className="space-y-4">`
  );
}

fs.writeFileSync(p, s);
console.log("done", s.includes("/pulse/settings"));
