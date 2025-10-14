/**
 * WebView検出・リダイレクト処理モジュール
 * 様々なアプリのWebView環境に対応
 * 
 * @version 1.0.0
 * @author Walter Grey
 * @description アプリ内ブラウザ（WebView）を検出し、外部ブラウザへのリダイレクトを提供
 * 
 *  LINE アプリのWebViewを検出し、外部ブラウザへのリダイレクトを提供
 *  将来無くなりそうなのでコードを分離
*/

 /**
  * URLパラメータによるリダイレクト処理
  * LINEの場合は、URLパラメータにopenExternalBrowser=1を追加してリダイレクトする必要があるため
  * @returns {boolean} - リダイレクトが実行されたかどうか
  * 
 */
  function handleLineRedirect() {
    if (typeof window === 'undefined') return false;

    const urlParams = new URLSearchParams(window.location.search);
    const openExternalBrowser = urlParams.get('openExternalBrowser');
    if (openExternalBrowser === '1') {
      const cleanUrl = window.location.origin + window.location.pathname;
      try {
        window.location.href = cleanUrl;
        return true;
      } catch {
        return false;
      }
    }

    return false;
}

function  redirectWithUrlParameter(currentUrl) {
    if (typeof window === 'undefined') return false;
    const externalUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
    try {
      window.location.href = externalUrl;
      return true;
    } catch {
      return false;
    }
}

export function lineWebViewHandler() {
  return {
    handleLineRedirect: handleLineRedirect,
    redirectWithUrlParameter: redirectWithUrlParameter,
  };
}

export default lineWebViewHandler;
