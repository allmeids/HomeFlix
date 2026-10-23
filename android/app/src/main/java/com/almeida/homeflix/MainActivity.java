package com.almeida.homeflix;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.app.UiModeManager;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.inputmethod.InputMethodManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import java.net.HttpURLConnection;
import java.net.URL;

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "HomeFlixPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER = "http://10.224.253.104:8080";
    private static final String[] CANDIDATE_SERVERS = new String[]{
            "http://10.224.253.104:8080",
            "http://100.114.206.70:8080",
            "http://100.111.162.28:8080"
    };

    private WebView webView;
    private FrameLayout customViewContainer;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private View customView;
    private SharedPreferences prefs;
    private String currentServerUrl;
    private boolean isTv = false;

    private boolean detectTvDevice() {
        UiModeManager uiModeManager = (UiModeManager) getSystemService(UI_MODE_SERVICE);
        return uiModeManager != null && uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION;
    }

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        isTv = detectTvDevice();
        if (isTv) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
        }

        // Bloqueia desligamento de tela durante o uso
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        // Ativa tela cheia imersiva (cinema mode)
        applyImmersiveMode();

        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        currentServerUrl = prefs.getString(KEY_SERVER_URL, DEFAULT_SERVER);

        // Layout raiz com container para vídeo customizado
        FrameLayout rootLayout = new FrameLayout(this);
        rootLayout.setBackgroundColor(Color.parseColor("#141414"));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.parseColor("#141414"));

        customViewContainer = new FrameLayout(this);
        customViewContainer.setVisibility(View.GONE);
        customViewContainer.setBackgroundColor(Color.BLACK);

        rootLayout.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        rootLayout.addView(customViewContainer, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));

        setContentView(rootLayout);

        setupWebView();

        // Carrega o HomeFlix com descoberta inteligente entre Mac Wi-Fi / Tailscale / Dell
        discoverAndLoadServer(currentServerUrl);
    }

    public class AndroidBridge {
        @android.webkit.JavascriptInterface
        public long getAppVersionCode() {
            try {
                android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ?
                        pInfo.getLongVersionCode() : pInfo.versionCode;
            } catch (Exception e) {
                return 1;
            }
        }

        @android.webkit.JavascriptInterface
        public String getAppVersionName() {
            try {
                android.content.pm.PackageInfo pInfo = getPackageManager().getPackageInfo(getPackageName(), 0);
                return pInfo.versionName;
            } catch (Exception e) {
                return "1.0.0";
            }
        }

        @android.webkit.JavascriptInterface
        public void startAppUpdate(String downloadUrl) {
            runOnUiThread(() -> {
                AppUpdater.startDownloadAndInstall(MainActivity.this, downloadUrl);
            });
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
        webView.addJavascriptInterface(new AndroidBridge(), "HomeFlixApp");
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);

        // Cookies
        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(webView, true);

        // Suporte a zoom desativado para manter proporção mobile perfeita de app
        settings.setSupportZoom(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                applyImmersiveMode();
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                applyImmersiveMode();
                AppUpdater.checkForUpdates(MainActivity.this, currentServerUrl, webView);
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    showConnectionErrorDialog();
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                webView.setVisibility(View.GONE);
                customViewContainer.addView(view);
                customViewContainer.setVisibility(View.VISIBLE);

                // Trava na horizontal durante o vídeo em tela cheia
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
                applyImmersiveMode();
            }

            @Override
            public void onHideCustomView() {
                if (customView == null) return;

                webView.setVisibility(View.VISIBLE);
                customViewContainer.setVisibility(View.GONE);
                customViewContainer.removeView(customView);
                customView = null;

                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }

                // Na TV mantém sempre horizontal; no celular restaura rotação automática
                setRequestedOrientation(isTv ?
                        ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE :
                        ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                applyImmersiveMode();
            }
        });

        // Habilita foco e interação tátil suave
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
    }

    private boolean isServerReachable(String baseUrl) {
        HttpURLConnection conn = null;
        try {
            URL url = new URL(baseUrl + "/api/app/version");
            conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setConnectTimeout(1500);
            conn.setReadTimeout(1500);
            int code = conn.getResponseCode();
            return code >= 200 && code < 500;
        } catch (Exception e) {
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private void discoverAndLoadServer(String preferredUrl) {
        new Thread(() -> {
            if (isServerReachable(preferredUrl)) {
                runOnUiThread(() -> loadServerUrl(preferredUrl));
                return;
            }
            for (String candidate : CANDIDATE_SERVERS) {
                if (candidate.equals(preferredUrl)) continue;
                if (isServerReachable(candidate)) {
                    prefs.edit().putString(KEY_SERVER_URL, candidate).apply();
                    runOnUiThread(() -> loadServerUrl(candidate));
                    return;
                }
            }
            runOnUiThread(() -> loadServerUrl(preferredUrl));
        }).start();
    }

    private void loadServerUrl(String url) {
        if (!url.startsWith("http://") && !url.startsWith("https://")) {
            url = "http://" + url;
        }
        currentServerUrl = url;
        webView.loadUrl(url);
    }

    private void showConnectionErrorDialog() {
        new AlertDialog.Builder(this)
                .setTitle("Conexão com HomeFlix")
                .setMessage("Não foi possível conectar em " + currentServerUrl + ".\n\nVerifique se o computador com o HomeFlix está ligado ou altere o IP.")
                .setPositiveButton("Tentar Novamente", (dialog, which) -> {
                    discoverAndLoadServer(currentServerUrl);
                })
                .setNeutralButton("Configurar Servidor", (dialog, which) -> {
                    showServerConfigDialog();
                })
                .setCancelable(true)
                .show();
    }

    private void showServerConfigDialog() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setTitle("Configurar Servidor HomeFlix");

        final EditText input = new EditText(this);
        input.setHint("http://10.224.253.104:8080");
        input.setText(currentServerUrl);
        builder.setView(input);

        builder.setPositiveButton("Salvar e Conectar", (dialog, which) -> {
            String newUrl = input.getText().toString().trim();
            if (!newUrl.isEmpty()) {
                prefs.edit().putString(KEY_SERVER_URL, newUrl).apply();
                loadServerUrl(newUrl);
                Toast.makeText(this, "Conectando ao servidor...", Toast.LENGTH_SHORT).show();
            }
        });

        builder.setNegativeButton("Cancelar", null);
        builder.show();
    }

    private void applyImmersiveMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT) {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            );
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyImmersiveMode();
        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        String jsKey = null;

        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_UP:
                jsKey = "ArrowUp";
                break;
            case KeyEvent.KEYCODE_DPAD_DOWN:
                jsKey = "ArrowDown";
                break;
            case KeyEvent.KEYCODE_DPAD_LEFT:
                jsKey = "ArrowLeft";
                break;
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                jsKey = "ArrowRight";
                break;
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER:
                jsKey = "Enter";
                break;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
            case KeyEvent.KEYCODE_MEDIA_PLAY:
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
                jsKey = " ";
                break;
        }

        if (jsKey != null && webView != null && webView.getVisibility() == View.VISIBLE) {
            if (event.getAction() == KeyEvent.ACTION_DOWN) {
                if ("Enter".equals(jsKey) && event.getRepeatCount() > 0) {
                    return true;
                }
                final String keyToSend = jsKey;
                String dispatchJs =
                        "(function() {" +
                        "  var el = document.activeElement || window;" +
                        "  if (el && el.tagName === 'INPUT' && '" + keyToSend + "' === 'Enter') {" +
                        "    return 'INPUT_FOCUS';" +
                        "  }" +
                        "  var ev = new KeyboardEvent('keydown', { key: '" + keyToSend + "', code: '" + keyToSend + "', bubbles: true, cancelable: true });" +
                        "  (el && el !== document.body ? el : window).dispatchEvent(ev);" +
                        "  return 'OK';" +
                        "})();";
                webView.evaluateJavascript(dispatchJs, value -> {
                    if (value != null && value.contains("INPUT_FOCUS")) {
                        InputMethodManager imm = (InputMethodManager) getSystemService(Context.INPUT_METHOD_SERVICE);
                        if (imm != null) {
                            imm.showSoftInput(webView, InputMethodManager.SHOW_FORCED);
                        }
                    }
                });
            }
            return true;
        }

        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            // Se estiver com vídeo em tela cheia, sai da tela cheia primeiro
            WebChromeClient client = new WebChromeClient();
            client.onHideCustomView();
            return;
        }

        // Tenta fechar Player aberto ou modal através de script JS no WebView
        if (webView != null) {
            String checkAndCloseJs =
                    "(function() {" +
                    "  if (window.app && window.app.player && window.app.player.overlay && window.app.player.overlay.classList.contains('open')) {" +
                    "    window.app.player.close();" +
                    "    return true;" +
                    "  }" +
                    "  const detailsView = document.getElementById('detailsView');" +
                    "  if (detailsView && detailsView.style.display !== 'none') {" +
                    "    detailsView.style.display = 'none';" +
                    "    document.body.classList.remove('in-details-view');" +
                    "    if (window.app) window.app.switchTab('home');" +
                    "    return true;" +
                    "  }" +
                    "  const openModal = document.querySelector('.modal-backdrop.open, .modal-backdrop.active');" +
                    "  if (openModal && !openModal.id.includes('profileModal')) {" +
                    "    openModal.classList.remove('open', 'active');" +
                    "    return true;" +
                    "  }" +
                    "  return false;" +
                    "})();";

            webView.evaluateJavascript(checkAndCloseJs, value -> {
                if ("true".equals(value)) {
                    // O player ou modal foi fechado com sucesso, sem sair da tela
                    return;
                }
                if (webView.canGoBack()) {
                    webView.goBack();
                } else {
                    super.onBackPressed();
                }
            });
            return;
        }

        super.onBackPressed();
    }
}
