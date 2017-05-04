import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http 
import Json.Decode as Decode

main =
    Html.program
    {
      init = init
    , view = view
    , update = update
    , subscriptions = subscriptions
    }

-- MODEL 

type alias Model =
  {
    jobStatus : String
  }

init : (Model, Cmd Msg) 
init =
  ( Model "kukaki"
  , Cmd.none
  )

-- UPDATE 

type Msg
  = CheckStatus
  | NewStatus (Result Http.Error String)

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of 
    CheckStatus ->
      (model, getJobStatus "6f885cfd-7b84-49f2-92ed-447a842718df")

    NewStatus (Ok newStatus) ->
      (Model newStatus, Cmd.none)

    NewStatus (Err _) ->
      (Model "error", Cmd.none)


view : Model -> Html Msg
view model =
  div []
    [ h2 [] [text "TravelTime"]
    , button [ onClick CheckStatus ] [ text "Check job status" ]
    , br [] []
    , h4 [] [text model.jobStatus]
    ]

-- SUBSCRIPTIONS
subscriptions : Model -> Sub Msg
subscriptions model =
  Sub.none


-- HTTP
getJobStatus : String -> Cmd Msg
getJobStatus job =
    let
      url = "http://localhost/v1/status/" ++ job
    in 
      Http.send NewStatus (Http.get url decodeJobStatusUrl)


decodeJobStatusUrl : Decode.Decoder String 
decodeJobStatusUrl = 
    Decode.at ["result", "status"] Decode.string

