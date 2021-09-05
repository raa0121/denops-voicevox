# denops-voicevox

Talk text on [Vicevox](https://voicevox.hiroshiba.jp)

## Usage
```
:VoicevoxTalk こんばんわ、ずんだもんなのだ。
:%VoicevoxTalk
```

## Requirements
Vim need `+sound` feature.

[denops.vim](https://github.com/vim-denops.vim)

## Installation

For [vim-plug](https://github.com/junegunn/vim-plug) plugin manager:

```vim
Plug 'vim-denops/denops.vim'
Plug 'raa0121/denops-voivevox'
```

For [dein.vim](https://github.com/Shougo/dein.vim) plugin manager:

```vim
call dein#add('vim-denops/denops.vim')
call dein#add('raa0121/denops-voivevox')
```

## Config
```vim
let g:voicevox_api_entrypoint = 'http://localhost:50012/' " ( default: http://127.0.0.1:50021/ )
let g:voicevox_speaker = 0 " speaker: 0 => 四国めたん, 1 => ずんだもん ( default: 1 )
```

## License
MIT License

## Author
raa0121 <raa0121@gmail.com>
