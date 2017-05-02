import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)

infoHeader : Html msg
infoHeader =
    header
    [ class "header" ]
    [ h1 [] [ text "TravelTime"],
      p [] [ text "Minimize your time commuting." ]]

main = infoHeader


