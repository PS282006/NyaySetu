package com.nyaysetu.app;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeGoogleAuthPlugin.class);
        super.onCreate(savedInstanceState);
        WebView webView = this.getBridge() != null ? this.getBridge().getWebView() : null;
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setJavaScriptCanOpenWindowsAutomatically(true);
            settings.setSupportMultipleWindows(true);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
        }
    }
}
