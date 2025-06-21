
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/deck_provider.dart';
import '../models/deck.dart';
import 'deck_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DeckProvider>().loadDecks();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MTG Deck Builder'),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Consumer<DeckProvider>(
        builder: (context, deckProvider, child) {
          if (deckProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (deckProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Error: ${deckProvider.error}'),
                  ElevatedButton(
                    onPressed: () => deckProvider.loadDecks(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: deckProvider.decks.length,
            itemBuilder: (context, index) {
              final deck = deckProvider.decks[index];
              return DeckCard(deck: deck);
            },
          );
        },
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showCreateDeckDialog(context),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showCreateDeckDialog(BuildContext context) {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    String selectedFormat = 'Standard';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Create New Deck'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Deck Name'),
            ),
            TextField(
              controller: descriptionController,
              decoration: const InputDecoration(labelText: 'Description'),
            ),
            DropdownButtonFormField<String>(
              value: selectedFormat,
              items: ['Standard', 'Modern', 'Legacy', 'Commander', 'Pioneer']
                  .map((format) => DropdownMenuItem(
                        value: format,
                        child: Text(format),
                      ))
                  .toList(),
              onChanged: (value) => selectedFormat = value!,
              decoration: const InputDecoration(labelText: 'Format'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (nameController.text.isNotEmpty) {
                context.read<DeckProvider>().createDeck(
                      nameController.text,
                      selectedFormat,
                      description: descriptionController.text.isEmpty
                          ? null
                          : descriptionController.text,
                    );
                Navigator.pop(context);
              }
            },
            child: const Text('Create'),
          ),
        ],
      ),
    );
  }
}

class DeckCard extends StatelessWidget {
  final Deck deck;

  const DeckCard({super.key, required this.deck});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.all(8.0),
      child: ListTile(
        title: Text(deck.name),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (deck.description != null) Text(deck.description!),
            Text('Format: ${deck.format}'),
            Text('Cards: ${deck.cards?.length ?? 0}'),
          ],
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete),
          onPressed: () => _confirmDelete(context),
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => DeckScreen(deckId: deck.id!),
            ),
          );
        },
      ),
    );
  }

  void _confirmDelete(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Deck'),
        content: Text('Are you sure you want to delete "${deck.name}"?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              context.read<DeckProvider>().deleteDeck(deck.id!);
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
