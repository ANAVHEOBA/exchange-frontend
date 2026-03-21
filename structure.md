exchange-frontend/
├── public/
│   ├── favicon.ico
│   ├── background.jpg
│   └── manifest.json                    # PWA manifest
│
├── src/
│   ├── app.tsx
│   ├── app.css
│   ├── entry-client.tsx
│   ├── entry-server.tsx
│   │
│   ├── api/                             # API Integration Layer
│   │   ├── client.ts                    # Base HTTP client (fetch wrapper)
│   │   ├── websocket.ts                 # WebSocket client for real-time updates
│   │   ├── endpoints/
│   │   │   ├── rates.ts                 # GET /api/rates/:from/:to
│   │   │   ├── swap.ts                  # POST /api/swap/initiate, GET /api/swap/:id
│   │   │   ├── currencies.ts            # GET /api/currencies
│   │   │   ├── chains.ts                # GET /api/chains
│   │   │   └── wallet.ts                # POST /api/wallet/balance
│   │   └── types.ts                     # API request/response types
│   │
│   ├── stores/                          # State Management (SolidJS Stores)
│   │   ├── rateStore.ts                 # Exchange rates cache + logic
│   │   ├── swapStore.ts                 # Active swap state
│   │   ├── walletStore.ts               # Wallet balances + addresses
│   │   ├── currencyStore.ts             # Available currencies list
│   │   └── userStore.ts                 # User preferences + settings
│   │
│   ├── services/                        # Business Logic Layer
│   │   ├── cache/
│   │   │   ├── memoryCache.ts           # In-memory cache with TTL
│   │   │   ├── indexedDB.ts             # IndexedDB wrapper for offline data
│   │   │   └── cacheManager.ts          # Unified cache interface
│   │   ├── swap/
│   │   │   ├── swapService.ts           # Swap orchestration logic
│   │   │   ├── priceCalculator.ts       # Calculate amounts, fees, etc.
│   │   │   └── validator.ts             # Validate swap inputs
│   │   ├── wallet/
│   │   │   ├── walletService.ts         # Wallet operations
│   │   │   └── addressValidator.ts      # Validate blockchain addresses
│   │   └── realtime/
│   │       ├── rateUpdater.ts           # WebSocket rate subscription
│   │       └── swapMonitor.ts           # Monitor active swap status
│   │
│   ├── hooks/                           # Reusable SolidJS Hooks
│   │   ├── useRates.ts                  # Hook for fetching/caching rates
│   │   ├── useSwap.ts                   # Hook for swap operations
│   │   ├── useWallet.ts                 # Hook for wallet operations
│   │   ├── useCurrencies.ts             # Hook for currency list
│   │   ├── useDebounce.ts               # Debounce user input
│   │   └── useCache.ts                  # Generic cache hook
│   │
│   ├── components/
│   │   ├── SwapModal/
│   │   │   ├── SwapModal.tsx
│   │   │   ├── SwapModal.css
│   │   │   ├── CurrencySelector.tsx     # Dropdown for selecting currency
│   │   │   ├── AmountInput.tsx          # Input with validation
│   │   │   ├── RateDisplay.tsx          # Show current rate
│   │   │   └── SwapButton.tsx           # Execute swap button
│   │   ├── Hero/
│   │   │   ├── Hero.tsx
│   │   │   └── Hero.css
│   │   ├── TransactionStatus/
│   │   │   ├── TransactionStatus.tsx    # Show swap progress
│   │   │   └── TransactionStatus.css
│   │   ├── CurrencyList/
│   │   │   ├── CurrencyList.tsx         # Virtual scrolling list
│   │   │   └── CurrencyList.css
│   │   └── Shared/
│   │       ├── Loading.tsx
│   │       ├── ErrorBoundary.tsx
│   │       └── Toast.tsx                # Notifications
│   │
│   ├── utils/                           # Utility Functions
│   │   ├── format.ts                    # Format numbers, currencies
│   │   ├── validation.ts                # Input validation helpers
│   │   ├── constants.ts                 # App constants
│   │   ├── logger.ts                    # Frontend logging
│   │   └── errors.ts                    # Error handling utilities
│   │
│   ├── types/                           # TypeScript Types
│   │   ├── swap.ts                      # Swap-related types
│   │   ├── currency.ts                  # Currency types
│   │   ├── wallet.ts                    # Wallet types
│   │   ├── rate.ts                      # Rate types
│   │   └── api.ts                       # Generic API types
│   │
│   ├── config/                          # Configuration
│   │   ├── api.ts                       # API base URLs, timeouts
│   │   ├── cache.ts                     # Cache TTL settings
│   │   ├── chains.ts                    # Blockchain configs (from backend)
│   │   └── features.ts                  # Feature flags
│   │
│   └── routes/                          # Pages
│       ├── index.tsx                    # Home page
│       ├── swap.tsx                     # Swap page
│       ├── history.tsx                  # Transaction history
│       └── [...404].tsx                 # 404 page
│
├── .env.example                         # Environment variables template
├── .env.local                           # Local environment variables
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md


# Key Files Content Structure:

# src/api/client.ts
├── createApiClient()                    # Base fetch wrapper
├── handleResponse()                     # Response parser
├── handleError()                        # Error handler
└── withRetry()                          # Retry logic

# src/api/endpoints/rates.ts
├── getRates(from, to)                   # GET /api/rates/:from/:to
├── streamRates(pairs)                   # WebSocket subscription
└── getRateHistory(from, to)             # GET /api/rates/history

# src/stores/rateStore.ts
├── rates: Map<string, Rate>             # In-memory rate cache
├── lastUpdated: Map<string, number>     # Cache timestamps
├── fetchRate(from, to)                  # Fetch with cache check
├── subscribeToRates(pairs)              # WebSocket subscription
└── clearExpiredCache()                  # Cleanup old entries

# src/services/cache/memoryCache.ts
├── set(key, value, ttl)                 # Store with TTL
├── get(key)                             # Retrieve if not expired
├── has(key)                             # Check existence
├── delete(key)                          # Remove entry
└── clear()                              # Clear all

# src/hooks/useRates.ts
├── useRates(from, to)                   # Returns: { rate, loading, error }
│   ├── Check memory cache
│   ├── Fetch from API if expired
│   ├── Subscribe to WebSocket updates
│   └── Return reactive signal

# src/components/SwapModal/SwapModal.tsx
├── Import useRates, useSwap, useCurrencies
├── Local state: fromAmount, toAmount, fromCurrency, toCurrency
├── Debounced rate fetching
├── Optimistic UI updates
└── Error handling + loading states


# Backend Integration Points:

exchange-shared/src/
├── modules/
│   └── swap/
│       └── routes.rs                    # API routes
│           ├── GET  /api/rates/:from/:to
│           ├── POST /api/swap/initiate
│           ├── GET  /api/swap/:id/status
│           └── WS   /api/rates/stream
│
└── services/
    ├── redis_cache.rs                   # Cache layer
    │   ├── cache_rate(from, to, rate, ttl=30s)
    │   ├── get_cached_rate(from, to)
    │   └── cache_currencies(list, ttl=300s)
    │
    └── trocador.rs                      # External API
        ├── fetch_rate(from, to)         # Call Trocador
        ├── initiate_swap(params)        # Start swap
        └── check_swap_status(id)        # Poll status


# Data Flow Example:

User types "0.5 BTC → XMR"
    ↓
SwapModal.tsx (debounce 300ms)
    ↓
useRates('BTC', 'XMR')
    ↓
rateStore.fetchRate('BTC', 'XMR')
    ↓
Check memoryCache.get('rate:BTC:XMR')
    ↓ (if expired)
api/endpoints/rates.getRates('BTC', 'XMR')
    ↓
GET https://api.yourbackend.com/api/rates/BTC/XMR
    ↓
Backend: Check Redis cache
    ↓ (if miss)
Backend: Call Trocador API
    ↓
Backend: Cache in Redis (30s TTL)
    ↓
Backend: Return JSON response
    ↓
Frontend: Cache in memory (30s TTL)
    ↓
Frontend: Update UI with rate
