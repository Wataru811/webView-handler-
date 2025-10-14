/**
 * WebView検出・リダイレクト処理モジュール
 * 様々なアプリのWebView環境に対応
 * 
 * @version 1.0.0
 * @description アプリ内ブラウザ（WebView）を検出し、外部ブラウザへのリダイレクトを提供
 * 
 * ⚠️ 重要な制限事項:
 * - iOS X（旧Twitter）アプリは現在未対応
 * - Android X.comアプリも現在未対応
 * - iOS XアプリはSafariをWebViewとして使用するため、User Agentでは判定不可
 * - Android X.comアプリではOAuth/Popupが表示できずに止まる
 * - Firebase認証などでエラーが発生
 * - 外部ブラウザへのリダイレクトも制限される
 * 
 * @example
 * // 基本的な使用方法
 * import { createWebViewHandler } from './webViewHandler.js';
 * 
 * const webViewHandler = createWebViewHandler();
 * 
 * // WebView検出とリダイレクト処理を実行
 * const isRedirected = webViewHandler.handleWebViewDetection();
 * 
 * if (isRedirected) {
 *   console.log('WebViewから外部ブラウザにリダイレクトしました');
 * }
 * 
 * @example
 * // 特定のアプリのWebView検出
 * const detector = webViewHandler.detector;
 * 
 * if (detector.detectAppByUA('LINE')) {
 *   console.log('LINE内ブラウザを検出しました');
 * }
 * 
 * if (detector.detectAppByUA('MESSENGER')) {
 *   console.log('Messenger内ブラウザを検出しました');
 * }
 * 
 * @example
 * // X/Twitter, Telegram アプリの制限について
 *  iOS Xアプリでは以下の問題が発生します:
 *  1. OAuth/Popupが禁止されているため、Firebase認証でエラー
 *  2. 外部ブラウザへのリダイレクトが制限される
 *  3. User Agentでは判定できないため、検出不可
 *  Android X.comアプリでは以下の問題が発生します:
 *  1. OAuth/Popupが表示できずに止まる
 *  2. 外部ブラウザへのリダイレクトが制限される
 *  
 *  現在、X/Twitter, Telegram アプリへの対応方法は研究中です
 */

// WebView検出パターン定義
const WEBVIEW_PATTERNS = {
  // 主要アプリ（優先度順）
  LINE: /line/i,
  INSTAGRAM: /instagram/i,
  MESSENGER: /FBAV|FB_IAB/i,
  WHATSAPP: /whatsapp/i,
  WECHAT: /micromessenger/i,
  ZALO: /zalo/i,
  TELEGRAM: /telegram/i,   // 現在は使えない
  
  // プラットフォーム別 (テストできないので保留)
  //ANDROID_WEBVIEW: /wv/i,
  //IOS_WEBVIEW: /mobile safari.*version/i,
  //GENERIC_WEBVIEW: /webview/i

  // X/Twitter: iOS Xアプリ・Android X.comアプリ共に現在未対応
  // - iOS: SafariをWebViewとして使用するため判定不可
  // - Android: OAuth/Popupが表示できずに止まる

};

// 多言語テキスト定義
const DIALOG_TEXTS = {
  ja: {
    title: '内ブラウザではご利用になれません',
    description: '安全な認証のため、外部ブラウザで開く必要があります。<br>この画面を閉じて、外部ブラウザで続行してください。',
    hint: 'ヒント',
    copyButton: '📋 URLをコピーする',
    copySuccess: '✅ コピーしました',
    copyError: '❌ コピーに失敗しました'
  },
  en: {
    title: 'Cannot be used in in-app browser',
    description: 'For secure authentication, you need to open in an external browser.<br>Please close this screen and continue in an external browser.',
    hint: 'Hint',
    copyButton: '📋 Copy URL',
    copySuccess: '✅ Copied',
    copyError: '❌ Copy failed'
  }
};

// アプリ設定定義
const APP_CONFIGS = {
  MESSENGER: {
    name: 'Messenger',
    icon: '📱',
    color: '#007AFF',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  INSTAGRAM: {
    name: 'Instagram',
    icon: '📱',
    color: '#E4405F',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  TELEGRAM: {
    name: 'Telegram',
    icon: '📱',
    color: '#0088cc',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  WECHAT: {
    name: 'WeChat',
    icon: '📱',
    color: '#07c160',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  LINE: {
    name: 'LINE',
    icon: '📱',
    color: '#00C300',
    hint: '右下の「...」メニューから「ブラウザで開く」を選択'
  },
  WHATSAPP: {
    name: 'WhatsApp',
    icon: '📱',
    color: '#25D366',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  ZALO: {
    name: 'Zalo',
    icon: '📱',
    color: '#0068FF',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  ANDROID_WEBVIEW: {
    name: 'Android WebView',
    icon: '📱',
    color: '#3DDC84',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  IOS_WEBVIEW: {
    name: 'iOS WebView',
    icon: '📱',
    color: '#007AFF',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  },
  GENERIC_WEBVIEW: {
    name: 'WebView',
    icon: '📱',
    color: '#6C757D',
    hint: '右上の「...」メニューから「ブラウザで開く」を選択'
  }
};

/**
 * 言語検出機能
 * @returns {string} - 言語コード ('ja' または 'en')
 */
function detectLanguage() {
  if (typeof window === 'undefined') return 'en';
  const browserLang = navigator.language || navigator.languages?.[0] || 'en';
  return browserLang.startsWith('ja') ? 'ja' : 'en';
}
/**
 * WebView検出クラス
 */
export class WebViewDetector {
  constructor() {
    this.navigator = typeof window !== 'undefined' ? window.navigator : null;
  }
  /**
   * 特定のアプリのWebViewを検出
   * @param {string} appName - アプリ名（WEBVIEW_PATTERNSのキー）
   * @returns {boolean}
   */
  detectAppByUA(appName) {
    if (!this.navigator) {
      return false;
    }
    const pattern = WEBVIEW_PATTERNS[appName];
    if (!pattern) {
      return false;
    }
    return pattern.test(this.navigator.userAgent);
  }

  /**
   * 検出されたアプリのリストを取得
   * @returns {string[]}
   */
  getDetectedAppsByUA() {
    return Object.keys(WEBVIEW_PATTERNS).filter(appName => 
      this.detectAppByUA(appName) 
    );
  }
 }

/**
 * WebViewリダイレクト処理クラス
 */
export class WebViewRedirector {
  constructor() {
    this.detector = new WebViewDetector();
  }
  /**
   * URLパラメータ戦略によるリダイレクト
   * @param {string} currentUrl - 現在のURL
   * @returns {boolean}
   */
  redirectWithUrlParameter(currentUrl) {
    if (typeof window === 'undefined') return false;
    const externalUrl = currentUrl + (currentUrl.includes('?') ? '&' : '?') + 'openExternalBrowser=1';
    try {
      window.location.href = externalUrl;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 外部ブラウザ戦略によるリダイレクト
   * @param {string} currentUrl - 現在のURL
   * @returns {boolean}
   */
  redirectToExternalBrowser(currentUrl) {
    if (typeof window === 'undefined') return false;
    try {
      window.open(currentUrl, '_blank');
      return true;
    } catch {
      return false;
    }
  }

  /**
   * location.href戦略によるリダイレクト
   * @param {string} currentUrl - 現在のURL
   * @returns {boolean}
   */
  redirectWithLocationHref(currentUrl) {
    if (typeof window === 'undefined') return false;
    try {
      window.location.href = currentUrl;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 複数戦略によるフォールバックリダイレクト
   * @param {string} currentUrl - 現在のURL
   * @returns {boolean}
   */
  redirectWithFallback(currentUrl) {
    if (typeof window === 'undefined') return false;
    const strategies = [
      () => this.redirectToExternalBrowser(currentUrl),
      () => this.redirectWithLocationHref(currentUrl),
      () => this.redirectWithUrlParameter(currentUrl)
    ];
    for (const strategy of strategies) {
      try {
        if (strategy()) {
          return true;
        }
      } catch {
        // 戦略失敗時は次の戦略を試行
      }
    }

    return false;
  }

  /**
   * WebViewを閉じる処理
   * @returns {boolean}
   */
  closeWebView() {
    if (typeof window === 'undefined') return false;

    try {
      if (window.close) {
        window.close();
        return false;
      }
      
      if (window.history.length > 1) {
        window.history.back();
        return false;
      }
      
      window.location.href = 'about:blank';
      return false;
    } catch {
      return false;
    }
  }

  /**
   * X（旧Twitter）アプリのWebViewを検出
  * @returns {boolean} - 常にfalse（未対応のため）
   */
  isXAppWebView() {
    // iOS Xアプリは現在未対応
    // SafariをWebViewとして使用するため、User Agentでは判定不可
    return false;
  }

  /**
   * アプリ別の最適なリダイレクトを実行
   * @param {string} currentUrl - 現在のURL
   * @returns {boolean}
   */
  executeOptimalRedirect(currentUrl) {
    if (typeof window === 'undefined') return false;
    // LINEチェック：URLパラメータによるリダイレクトを優先。
    // （現在は安全のため、このツールではLINEのリダイレクトはしないので不要
    /* 
    if (this.handleUrl_LINEParameter_Redirect()) {
      return true;
    } 
    */
    
    // UA によるチェック。X.comアプリのwebViewは未対応 
    const detectedApps = this.detector.getDetectedAppsByUA();
    if (detectedApps.length === 0) {
      return false; // WebViewではない. UA対策されたwebViewは現在この経路。検出できない
    }

    // WebViewの対応。基本は外部ブラウザ利用の推奨メッセージ表示
    // 検出された最初のアプリでダイアログを表示（安全戦略）
    for (const app of detectedApps) {
      if (APP_CONFIGS[app]) {
        return this.handleWebViewMessage(currentUrl, app);
      }
    }
    
    // 設定にないWebViewの場合は汎用WebViewとして処理
    return this.handleWebViewMessage(currentUrl, 'GENERIC_WEBVIEW');
  }


  /**
   * X（旧Twitter）用のダイアログ表示処理
   * ⚠️ 注意: iOS Xアプリは現在未対応のため、このメソッドは呼ばれません
   * @param {string} _currentUrl - 現在のURL（未使用）
   * @returns {boolean}
   */
  /*
  handleXRedirect(_currentUrl) {
    // iOS Xアプリは未対応のため、このメソッドは実質的に使用されません
    this.showXSafariDialog();
    return true;
  }
  */

  /**
   * WebViewメッセージ表示処理
   * @param {string} _currentUrl - 現在のURL（未使用）
   * @param {string} appName - アプリ名（MESSENGER, INSTAGRAM, TELEGRAM, WECHAT, LINE）
   * @returns {boolean}
   */
  handleWebViewMessage(_currentUrl, appName) {
    const config = APP_CONFIGS[appName];
    if (!config) {
      return false;
    }
    this.showAppDialog(
      config.name,
      config.icon,
      config.color,
      config.hint
    );
    return true; // ダイアログ表示は成功とみなす
  }


  /**
   * 共通ダイアログ表示メソッド
   * @param {string} appName - アプリ名
   * @param {string} appIcon - アプリのアイコン
   * @param {string} buttonColor - ボタンの色
   * @param {string} hintText - ヒントテキスト
   * @returns {void}
   */
  showAppDialog(appName, appIcon, buttonColor, hintText) {
    if (typeof window === 'undefined') return;
    
    const dialogId = `${appName.toLowerCase()}-dialog`;
    const buttonId = `${appName.toLowerCase()}-copy-btn`;
    const currentUrl = window.location.href;
    const lang = detectLanguage();
    const texts = DIALOG_TEXTS[lang];
    
    // ダイアログのHTMLを作成
    const dialogHtml = `
      <div id="${dialogId}" style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="
          background: white;
          border-radius: 16px;
          padding: 24px;
          max-width: 320px;
          margin: 20px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        ">
          <div style="
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin-bottom: 16px;
          ">
            ${appIcon} ${appName}${texts.title}
          </div>
          <div style="
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
            line-height: 1.5;
          ">
            ${texts.description}
          </div>
          <div style="
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 12px;
            margin-bottom: 20px;
            font-size: 12px;
            color: #6c757d;
          ">
            💡 ${texts.hint}: ${hintText}
          </div>
          <button id="${buttonId}" style="
            background: ${buttonColor};
            color: white;
            border: none;
            border-radius: 8px;
            padding: 12px 24px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            width: 100%;
          ">
            ${texts.copyButton}
          </button>
        </div>
      </div>
    `;

    // ダイアログをDOMに追加
    document.body.insertAdjacentHTML('beforeend', dialogHtml);

    // ボタンクリックイベント
    const copyBtn = document.getElementById(buttonId);
    const dialog = document.getElementById(dialogId);
    
    if (copyBtn && dialog) {
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(currentUrl);
          // コピー成功時のフィードバック
          copyBtn.innerHTML = texts.copySuccess;
          copyBtn.style.background = '#28a745';
        } catch {
          // フォールバック: 古いブラウザ対応
          const textArea = document.createElement('textarea');
          textArea.value = currentUrl;
          document.body.appendChild(textArea);
          textArea.select();
          try {
            document.execCommand('copy');
            copyBtn.innerHTML = texts.copySuccess;
            copyBtn.style.background = '#28a745';
          } catch {
            copyBtn.innerHTML = texts.copyError;
            copyBtn.style.background = '#dc3545';
          }
          document.body.removeChild(textArea);
        }
      });
    }
  }
  /**
   * その他のアプリ用のリダイレクト処理
   * @param {string} currentUrl - 現在のURL
   * @returns {boolean}
   */
  handleOtherAppRedirect(currentUrl) {
    // 複数の方法で外部ブラウザを開く
    const methods = [
      () => window.open(currentUrl, '_blank'),
      () => { window.location.href = currentUrl; return true; },
      () => { window.location.replace(currentUrl); return true; }
    ];

    for (const method of methods) {
      try {
        if (method()) {
          return true;
        }
      } catch {
        // リダイレクト方法失敗時は次の方法を試行
      }
    }
    return false;
  }
}

/**
 * WebView処理のメイン関数
 * @returns {object} - WebView処理オブジェクト
 */
export function createWebViewHandler() {
  const redirector = new WebViewRedirector();
  
  return {
    detector: redirector.detector,
    redirector: redirector,
    
    // メイン処理関数
    handleWebViewDetection: () => {
      if (typeof window === 'undefined') return;
      
      const currentUrl = window.location.href;
      return redirector.executeOptimalRedirect(currentUrl);
    }
  };
}

export default createWebViewHandler;
