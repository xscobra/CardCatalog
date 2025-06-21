
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'screens/deck_screen.dart';
import 'services/api_service.dart';
import 'providers/deck_provider.dart';

void main() {
  runApp(const MTGDeckBuilderApp());
}

class MTGDeckBuilderApp extends StatelessWidget {
  const MTGDeckBuilderApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiService>(
          create: (_) => ApiService(),
        ),
        ChangeNotifierProvider<DeckProvider>(
          create: (context) => DeckProvider(context.read<ApiService>()),
        ),
      ],
      child: MaterialApp(
        title: 'MTG Deck Builder',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(seedColor: Colors.deepPurple),
          useMaterial3: true,
        ),
        home: const HomeScreen(),
        routes: {
          '/deck': (context) => const DeckScreen(),
        },
      ),
    );
  }
}
