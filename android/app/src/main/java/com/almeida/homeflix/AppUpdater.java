package com.almeida.homeflix;

import android.app.Activity;
import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.widget.Toast;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class AppUpdater {

    private static final String TAG = "HomeFlixUpdater";

    public static void checkForUpdates(final Activity activity, final String serverBaseUrl, final android.webkit.WebView webView) {
        new Thread(() -> {
            try {
                String versionUrl = serverBaseUrl.replaceAll("/+$", "") + "/api/app/version";
                URL url = new URL(versionUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(4000);
                conn.setReadTimeout(4000);
                conn.setRequestMethod("GET");

                if (conn.getResponseCode() == 200) {
                    BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream()));
                    StringBuilder sb = new StringBuilder();
                    String line;
                    while ((line = reader.readLine()) != null) {
                        sb.append(line);
                    }
                    reader.close();

                    JSONObject json = new JSONObject(sb.toString());
                    int remoteCode = json.optInt("version_code", 1);
                    String remoteName = json.optString("version_name", "1.0.0");
                    String downloadPath = json.optString("download_url", "/api/app/download");
                    String changelog = json.optString("changelog", "Melhorias de desempenho e estabilidade.");

                    PackageManager pm = activity.getPackageManager();
                    PackageInfo pInfo = pm.getPackageInfo(activity.getPackageName(), 0);
                    long currentCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P ?
                            pInfo.getLongVersionCode() : pInfo.versionCode;

                    if (remoteCode > currentCode) {
                        final String finalDownloadUrl = downloadPath.startsWith("http") ?
                                downloadPath : serverBaseUrl.replaceAll("/+$", "") + downloadPath;

                        new Handler(Looper.getMainLooper()).post(() -> {
                            if (!activity.isFinishing()) {
                                if (webView != null) {
                                    String safeChangelog = JSONObject.quote(changelog);
                                    webView.evaluateJavascript(
                                        "if (window.showAppUpdateModal) { window.showAppUpdateModal('" + remoteName + "', " + safeChangelog + ", '" + finalDownloadUrl + "'); }",
                                        null
                                    );
                                }
                            }
                        });
                    }
                }
            } catch (Exception e) {
                Log.d(TAG, "Verificação de update silenciosa: " + e.getMessage());
            }
        }).start();
    }

    public static void checkForUpdates(final Activity activity, final String serverBaseUrl) {
        checkForUpdates(activity, serverBaseUrl, null);
    }

    public static void startDownloadAndInstall(final Activity activity, final String downloadUrl) {
        final ProgressDialog progress = new ProgressDialog(activity);
        progress.setTitle("Baixando HomeFlix");
        progress.setMessage("Conectando ao servidor...");
        progress.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
        progress.setIndeterminate(false);
        progress.setMax(100);
        progress.setCancelable(false);
        progress.show();

        new Thread(() -> {
            File apkFile = null;
            try {
                URL url = new URL(downloadUrl);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setConnectTimeout(8000);
                conn.connect();

                int fileLength = conn.getContentLength();
                File cacheDir = activity.getExternalCacheDir() != null ? activity.getExternalCacheDir() : activity.getCacheDir();
                apkFile = new File(cacheDir, "HomeFlix_update.apk");
                if (apkFile.exists()) {
                    apkFile.delete();
                }

                InputStream in = conn.getInputStream();
                FileOutputStream out = new FileOutputStream(apkFile);

                byte[] buffer = new byte[8192];
                int total = 0;
                int count;

                while ((count = in.read(buffer)) != -1) {
                    total += count;
                    if (fileLength > 0) {
                        final int percent = (int) (total * 100L / fileLength);
                        new Handler(Looper.getMainLooper()).post(() -> {
                            progress.setProgress(percent);
                            progress.setMessage("Baixando: " + percent + "%");
                        });
                    }
                    out.write(buffer, 0, count);
                }

                out.flush();
                out.close();
                in.close();

                final File finalApk = apkFile;
                new Handler(Looper.getMainLooper()).post(() -> {
                    progress.dismiss();
                    installApk(activity, finalApk);
                });

            } catch (Exception e) {
                Log.e(TAG, "Erro no download do APK", e);
                new Handler(Looper.getMainLooper()).post(() -> {
                    progress.dismiss();
                    Toast.makeText(activity, "Erro ao baixar atualização: " + e.getMessage(), Toast.LENGTH_LONG).show();
                });
            }
        }).start();
    }

    private static void installApk(Context context, File apkFile) {
        try {
            if (!apkFile.exists()) return;

            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);

            Uri apkUri = FileProvider.getUriForFile(
                    context,
                    context.getPackageName() + ".fileprovider",
                    apkFile
            );

            intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            context.startActivity(intent);

        } catch (Exception e) {
            Log.e(TAG, "Falha ao instalar APK", e);
            Toast.makeText(context, "Erro ao abrir instalador: " + e.getMessage(), Toast.LENGTH_LONG).show();
        }
    }
}
