import { Denops, ensureNumber, ensureString, fn, vimFn, helper, ky, vars } from "./deps.ts";
import * as apiTypes from "./types.ts";
import * as wav from "./wav.ts";

type FileInfo = { path: string, length: number };

export async function main(denops: Denops): Promise<void> {
  denops.dispatcher = {
    async talk(text: unknown, line1: unknown, line2: unknown, count: unknown): Promise<void>{
      if (false == await fn.has(denops, 'sound')) {
        helper.echo(denops, "please build +sound");
        return
      }
      ensureString(text);
      ensureNumber(line1);
      ensureNumber(line2);
      ensureNumber(count);
      const mes = await Promise.resolve(text);
      if (mes.length == 0) {
        const lines = await denops.call("getline", line1, line2) as string[];
        if (count == 0) {
          helper.echo(denops, 'no message');
          return
        }
        for (let i = 0; i < lines.length; i++) {
          const query = await audioQuery(denops, lines[i]);
          const wavFile = await synthesis(denops, query);
          await vimFn.sound_playfile(denops, wavFile.path);
          if (i != lines.length - 1) {
            // 最後のファイルはスリープしない
            Deno.sleepSync(wavFile.length);
          }
        }
      } else {
        const query = await audioQuery(denops, mes);
        const wavFile = await synthesis(denops, query);
        await vimFn.sound_playfile(denops, wavFile.path);
      }
    },
  };
  await helper.execute(
    denops,
    `command! -nargs=? -range=0 VoicevoxTalk call denops#notify('${denops.name}', 'talk', [<q-args>, <line1>, <line2>, <count>])`,
  );
}

async function audioQuery(denops: Denops, text: string) : Promise<apiTypes.AudioQueryRes> {
  const API_BASE: string = await vars.g.get(denops, "voicevox_api_entrypoint") ||
    "http://127.0.0.1:50021/";
  const api = ky.default.create({ prefixUrl: API_BASE });
  const result = await api.post("audio_query", {
    searchParams: {
      text: text,
      speaker: 1
    },
  }).json<apiTypes.AudioQueryRes>();
  return result;
}

async function synthesis(denops: Denops, query: apiTypes.AudioQueryRes) : Promise<FileInfo> {
  const API_BASE: string = await vars.g.get(denops, "voicevox_api_entrypoint") ||
    "http://127.0.0.1:50021/";
  const api = ky.default.create({ prefixUrl: API_BASE });
  const headers = new Headers({
    'Accept': 'audio/wav'
  });
  const tmpFile = Deno.makeTempFileSync({ prefix: `denops-voicevox-`, suffix: `.wav`})
  let wavLength = 0;

  await api.post("synthesis", {
    json: query,
    headers: headers,
    searchParams: {
      speaker: 1,
    },
  })
  .arrayBuffer()
  .then(buffer => {
    const body = new Uint8Array(buffer);
    Deno.writeFileSync(tmpFile, body);
    const w = new wav.TWaveFormat(body);
    wavLength = w.Analyst.time
  });

  return {path: tmpFile, length: wavLength} as FileInfo;
}
