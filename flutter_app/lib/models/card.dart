
import 'package:json_annotation/json_annotation.dart';

part 'card.g.dart';

@JsonSerializable()
class MTGCard {
  final String id;
  final String name;
  @JsonKey(name: 'image_uris')
  final ImageUris? imageUris;
  @JsonKey(name: 'card_faces')
  final List<CardFace>? cardFaces;
  final Prices prices;
  final String set;
  @JsonKey(name: 'set_name')
  final String setName;
  @JsonKey(name: 'collector_number')
  final String collectorNumber;
  @JsonKey(name: 'set_type')
  final String setType;

  MTGCard({
    required this.id,
    required this.name,
    this.imageUris,
    this.cardFaces,
    required this.prices,
    required this.set,
    required this.setName,
    required this.collectorNumber,
    required this.setType,
  });

  String get imageUrl {
    if (imageUris?.normal != null) {
      return imageUris!.normal;
    }
    if (cardFaces?.isNotEmpty == true && cardFaces![0].imageUris?.normal != null) {
      return cardFaces![0].imageUris!.normal;
    }
    return '';
  }

  factory MTGCard.fromJson(Map<String, dynamic> json) => _$MTGCardFromJson(json);
  Map<String, dynamic> toJson() => _$MTGCardToJson(this);
}

@JsonSerializable()
class ImageUris {
  final String normal;

  ImageUris({required this.normal});

  factory ImageUris.fromJson(Map<String, dynamic> json) => _$ImageUrisFromJson(json);
  Map<String, dynamic> toJson() => _$ImageUrisToJson(this);
}

@JsonSerializable()
class CardFace {
  @JsonKey(name: 'image_uris')
  final ImageUris? imageUris;

  CardFace({this.imageUris});

  factory CardFace.fromJson(Map<String, dynamic> json) => _$CardFaceFromJson(json);
  Map<String, dynamic> toJson() => _$CardFaceToJson(this);
}

@JsonSerializable()
class Prices {
  final String? usd;
  @JsonKey(name: 'usd_foil')
  final String? usdFoil;

  Prices({this.usd, this.usdFoil});

  factory Prices.fromJson(Map<String, dynamic> json) => _$PricesFromJson(json);
  Map<String, dynamic> toJson() => _$PricesToJson(this);
}
