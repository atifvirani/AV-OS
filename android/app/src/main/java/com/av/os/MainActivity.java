package com.av.os;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // This registers your Kotlin plugin safely
        registerPlugin(InstalledAppsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}