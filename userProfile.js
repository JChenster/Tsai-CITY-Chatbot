class UserProfile {
    constructor(name, entrepreneurScore, intrapreneurScore, explorerScore, civicInnovatorScore, artistScore){
        this.name = name;
        this.entrepreneurScore = entrepreneurScore;
        this.intrapreneurScore = intrapreneurScore;
        this.explorerScore = explorerScore;
        this.civicInnovatorScore = civicInnovatorScore;
        this.artistScore = artistScore;
    }
}

module.exports.UserProfile = UserProfile;