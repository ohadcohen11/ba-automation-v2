---
config:
  layout: dagre
---
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
 
    %% New EPC Change Branch (S3 Replacement)
    Start([EPC Change Detected]) --> Significant{"Is the change<br>significant?"}
    Significant -- No --> EndInv([End Investigation])
    Significant -- Yes --> PayModel{"Are most brands<br>paying for Leads or Sales?"}

    %% Subgraph for Financial Metrics
    subgraph RevenueMetrics ["Revenue Metric Investigation (Price)"]
        PayModel -- Leads --> CheckEPL{"Did EPL Change?"}
        PayModel -- Sales --> CheckEPS{"Did EPS Change?"}
        
        CheckEPL -- Yes --> DealChange{"Did a brand<br>change their deal?"}
        CheckEPS -- Yes --> DealChange

        DealChange -- Yes --> EndDeal([Cause: Deal Change])
        DealChange -- No --> LineupChange{"Did Lineups Change?"}
        
        LineupChange -- Yes --> EndLineup([Cause: Lineup Change<br>affected EPL/EPS])
        LineupChange -- No --> UnknownPrice([Investigate other<br>price factors])
    end

    %% Subgraph for Conversion Metrics
    subgraph ConversionMetrics ["Conversion Investigation (Volume/CR)"]
        CheckEPL -- No --> CRLead[Check Outclick to Lead Ratio]
        CheckEPS -- No --> CRSale[Check Outclick to Sale Ratio]
        
        CRLead --> Scope{"Where did the<br>CR change come from?"}
        CRSale --> Scope
    end

    %% Subgraph for Specific Brand Deep Dive
    subgraph SpecificBrand ["Specific Brand Investigation"]
        Scope -- Specific Brand --> Reporting{"Verify Reporting:<br>Is it accurate?"}
        
        Reporting -- No/Internal Issue --> TicketData[Open Ticket to Data Team<br>to fix scripts]
        Reporting -- Yes/Matches Brand --> DeepDive{"Isolate Source"}
        
        DeepDive --> CheckLP[Check Landing Pages]
        DeepDive --> CheckDev[Check Devices]
        
        CheckLP --> ShareBrand[Share findings<br>with Brand]
        CheckDev --> ShareBrand
    end

    %% Subgraph for System/Traffic Deep Dive
    subgraph AllBrands ["Global/System Investigation"]
        Scope -- All Brands --> ProdChange{"Was there a<br>Product/Site Change?"}
        
        ProdChange -- Yes --> AnalyzeEff([Analyze the effect<br>of the change])
        ProdChange -- No --> AccountCheck{"Is the change on<br>ALL Accounts?<br>(Google, MSN, FB)"}
        
        AccountCheck -- Yes --> External([Cause: External Factors<br>Not related to our actions])
        AccountCheck -- No --> CampScope{"Is it from ALL campaigns<br>in the changed account?"}
        
        CampScope -- Yes --> ContactPub[Reach out to Publisher]
        CampScope -- No --> InvestCamp[Investigate Specific Campaign]
    end
    
    %% Original Links (updated to link to new EPC start node)
    A["ROAS Change"] --> B["CPA Change"] & Start
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
    s2 --> s1

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
    
    %% New EPC Styling
    classDef decision fill:#f9f,stroke:#333,stroke-width:2px;
    classDef process fill:#e1f5fe,stroke:#01579b,stroke-width:2px;
    classDef endstate fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px,rx:10;
    
    class Significant,PayModel,CheckEPL,CheckEPS,DealChange,LineupChange,Scope,Reporting,ProdChange,AccountCheck,CampScope,DeepDive decision;
    class Start,CRLead,CRSale,TicketData,CheckLP,CheckDev,ShareBrand,ContactPub,InvestCamp process;
    class EndInv,EndDeal,EndLineup,AnalyzeEff,External,UnknownPrice endstate;