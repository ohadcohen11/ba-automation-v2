flowchart TB
 subgraph s1["CPC Change Branch"]
        F["<br>"]
        E["CPC Change"]
        G@{ label: "<b>Source: Daily stats report</b><br><br>Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        H["check mix and adjust if needed"]
        G_NO_1["go back to CPC investigation"]
        I{"Is the change from a specific<br>source?"}
        J@{ label: "Recommendation:<br style=\"--tw-scale-x:\">adjust prices if needed" }
        L["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        K["Broad change diagnosis"]
        M{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        O{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        P{"<b>Source: Google</b><br><br>Check seasonality"}
        Q["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        S["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        T["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
  end
 subgraph s2["CVR Change Branch"]
        V["Diagnose CVR Change<br>"]
        U["CVR Change"]
        W["SCTR change"]
        X["Check if the change is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        Y{"<b>Source: Unicorn log</b><br><br>Check brand mix. Was<br>there a change in the lineup?"}
        Z@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AA["check mix and adjust if needed"]
        Z_NO_1["go back to CPC investigation"]
        AB{"Is the change from a specific<br>source?"}
        AC["Manually evaluate if the result<br>is distorted"]
        AD["End flow here, likely not the<br>cause"]
        AE["Check clicks volume<br>(change/change)"]
        AF["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AG["Broad change diagnosis"]
        AH{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AJ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        AK{"<b>Source: Google</b><br><br>Check seasonality"}
        AL["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        AN["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        AO["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
        AP["change in OCTL or OCTS"]
        AQ["Check if the change is coming from:<br>accounts/ segments/ quality/<br>page/ device/ campaigns<br>(including actual VS tCPA)/ match<br>type/ ad group/ keyword"]
        AR@{ label: "Check change<br>in click% (e.g. bought more 'best'<br>than 'free', bought more desktop<br>than mobile)" }
        AS["check mix and adjust if needed"]
        AR_NO_1["go back to CPC investigation"]
        AT{"Is the change from a specific<br>source?"}
        AU["Check clicks volume<br>(change/change)"]
        AV["Recommendation: Continue<br>specific investigation and<br>adjust prices if needed"]
        AW["Broad change diagnosis"]
        AX{"<b>Source: Google Interface</b><br><br>Check change<br>history activity"}
        AZ{"<b>Source: Google Interface</b><br><br>Check auction<br>insights"}
        BA{"<b>Source: Google</b><br><br>Check seasonality"}
        BB["Recommendation: Evaluate<br>changes, were they too<br>extreme or insufficient?"]
        BD["Recommendation: If<br>competition changed, consider<br>price/budget adjustments"]
        BE["Recommendation: If<br>holiday/event, implement<br>seasonality adjustments"]
        BF["Brands"]
        BG{"<b>Source: Unicorn log</b><br><br>Check brand mix: Was<br>there a change in the lineup?"}
        BH{"<b>Source: Dash tracks report</b><br><br>Check performance per<br>brand (OCTL/OCTS change)"}
        BI["Manually evaluate if the result<br>is desired"]
        BJ["End flow here, likely not the<br>cause"]
        BK["Recommendation: Investigate<br>specific cause of conversion<br>rate change"]
        BL["Recommendation: Recheck<br>traffic, likely originating from<br>there"]
  end
 subgraph s3["EPC Change Branch"]
        CA{"Is the change significant?"}
        C["EPC Change"]
        CB["End investigation"]
        CC["Investigate the cause"]
        CD{"Did EPL change?"}
        CG{"Did OCTL change?"}
        CE{"Was there a deal change?"}
        CF{"Was there a different lead attribution<br>between the brands?"}
        CQ["Further investigation is needed"]
        CH{"Is the issue with all brands<br>or a specific brand?"}
        CI["Check campaigns"]
        CJ{"Is the reporting similar to CMS?"}
        CK["Open a ticket to data to check the script"]
        CL{"Is the issue with all landing pages?"}
        CM["Tell the brand"]
        CN{"Is the issue with all devices?"}
        CO{"Is the issue with all publisher accounts?"}
        CP["Check campaigns"]
  end
    A["ROAS Change"] --> B["CPA Change"] & C
    B --> D{"CPC Change or CVR Change?"}
    D -- CPC Change --> E
    D -- CVR Change --> U
    E --> F
    F --> G & I
    G -- yes --> H
    G -- no --> G_NO_1
    I -- Yes --> J
    J --> L
    I -- No --> K
    K --> M & O & P
    M --> Q
    O --> S
    P --> T
    U -- Only if significant --> V
    V -- SCTR --> W
    W --> X & Y
    X -- No --> Z
    Z -- yes --> AA
    Z -- no --> Z_NO_1
    X -- Yes --> AB
    Y -- Yes --> AC
    Y -- No --> AD
    AB -- Yes --> AE
    AE --> AF
    AB -- No --> AG
    AG --> AH & AJ & AK
    AH --> AL
    AJ --> AN
    AK --> AO
    V -- CTL / CTS --> AP
    AP --> AQ & BF
    AQ -- No --> AR
    AR -- yes --> AS
    AR -- no --> AR_NO_1
    AQ -- Yes --> AT
    AT -- Yes --> AU
    AU --> AV
    AT -- No --> AW
    AW --> AX & AZ & BA
    AX --> BB
    AZ --> BD
    BA --> BE
    BF --> BG & BH
    BG -- Yes --> BI
    BG -- No --> BJ
    BH -- Specific Brand --> BK
    BH -- All Brands --> BL
    C --> CA
    CA -- No --> CB
    CA -- Yes --> CC
    CC --> CD
    CD -- No --> CG
    CD -- Yes --> CE
    CE -- Yes --> CB
    CE -- No --> CF
    CF -- Yes --> CB
    CF -- No --> CQ
    CG -- Yes --> CH
    CG -- No --> CQ
    CH -- All Brands --> CI
    CH -- Specific Brand --> CJ
    CJ -- No --> CK
    CJ -- Yes --> CL
    CL -- Specific Landing Page --> CM
    CL -- All Landing Pages --> CN
    CN -- Specific Device --> CM
    CN -- All Devices --> CO
    CO -- Yes --> CM
    CO -- No --> CP
    s2 --> s1
    s3 --> n1["Untitled Node"]

    G@{ shape: rect}
    J@{ shape: rect}
    Z@{ shape: rect}
    AR@{ shape: rect}
    style F stroke:#000000,fill:transparent
    style G_NO_1 stroke:#000000
    style L stroke:#D50000
    style Z_NO_1 stroke:#000000
    style AR_NO_1 stroke:#000000
    style s1 stroke:#000000