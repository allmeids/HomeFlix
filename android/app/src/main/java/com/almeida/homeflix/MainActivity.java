package com.almeida.homeflix;

import android.annotation.SuppressLint;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.graphics.Bitmap;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
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

public class MainActivity extends AppCompatActivity {

    private static final String PREFS_NAME = "HomeFlixPrefs";
    private static final String KEY_SERVER_URL = "server_url";
    private static final String DEFAULT_SERVER = "http://100.111.162.28:8080";

    private WebView webView;
    private FrameLayout customViewContainer;
    private WebChromeClient.CustomViewCallback customViewCallback;
    private View customView;
    private SharedPreferences prefs;
    private String currentServerUrl;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

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

        // Carrega o HomeFlix
        loadServerUrl(currentServerUrl);

        // Verifica silenciosamente atualizações do aplicativo (OTA)
        AppUpdater.checkForUpdates(this, currentServerUrl);
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void setupWebView() {
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

                // Restaura rotação automática do celular
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
                applyImmersiveMode();
            }
        });

        // Habilita foco e interação tátil suave
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
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
                    loadServerUrl(currentServerUrl);
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
        input.setHint("http://100.111.162.28:8080");
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
    public void onBackPressed() {
        if (customView != null) {
            // Se estiver com vídeo em tela cheia, sai da tela cheia primeiro
            WebChromeClient client = new WebChromeClient();
            client.onHideCustomView();
            return;
        }

        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
