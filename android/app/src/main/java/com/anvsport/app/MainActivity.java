package com.anvsport.app;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
    }

    @Override
    public void onStart() {
        super.onStart();

        // Giữ toàn bộ navigation trong WebView, không mở Chrome
        WebView webView = getBridge().getWebView();
        webView.setWebViewClient(new com.getcapacitor.BridgeWebViewClient(getBridge()) {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                String url = request.getUrl().toString();

                // Scheme nội bộ Capacitor — xử lý bình thường
                if (url.startsWith("capacitor://") || url.startsWith("ionic://") || url.startsWith("about:")) {
                    return super.shouldOverrideUrlLoading(view, request);
                }

                // Mọi URL http/https load trong WebView, không mở Chrome
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    view.loadUrl(url);
                    return true;
                }

                return super.shouldOverrideUrlLoading(view, request);
            }
        });
    }
}
