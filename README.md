![is webview?](./iswebview.jpg)


# webView-handler-
webView detection module for handling when sharing a web app to Messenger via URL and a webView opens。

（課題）
x.com,telegram アプリはUA判定できず。　Androidではpopupもできるため判定が困難。iOSではoauth popupがブロックされる

対応状況
| メッセンジャー | UAテスト | iOS | Android | 実装など |
|----------------|-----------|------|----------|-----------|
| LINE | /line/i | ✅ | ✅ | ダイアログで正規ブラウザ利用を促す<br>リダイレクト判定可能だが将来の変更にそなえ使わない |
| INSTAGRAM | /instagram/i | ✅ | ✅ | ダイアログで正規ブラウザ利用を促す |
| MESSENGER | /FBAV\|FB_IAB/i | ✅ | ✅ | ダイアログで正規ブラウザ利用を促す |
| WHATSAPP | /whatsapp/i | ✅ | ✅ | アプリ仕様で正規ブラウザへリダイレクト |
| ZALO | /zalo/i | ✅ | ✅ | ダイアログで正規ブラウザ利用を促す |
| TELEGRAM |  | ❌ | ❌ | 判定不能 |
| X/Twitter |  | ❌ | ❌ | 判定不能。iOSアプリは oauth のポップアップをブロック |




