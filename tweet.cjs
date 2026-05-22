const { exec } = require('child_process');
const text = encodeURIComponent("🚀 ¡Acabamos de lanzar Unified Agent Router SaaS! 🌐\n\nLos agentes de IA ahora pueden acceder a liquidez DeFi cross-chain óptima (1inch, LI.FI, Rango) sin instalar nada. Envía un POST y recibe el payload exacto listo para firmar (incluyendo gas). 🤖💸\n\n¡Ya notificamos a +100 proyectos open-source en GitHub!\n\nEndpoint Público: https://little-earwig-99.loca.lt\n#AI #DeFi #Web3");
const url = `https://x.com/intent/tweet?text=${text}`;
exec(`start "" "${url}"`);
